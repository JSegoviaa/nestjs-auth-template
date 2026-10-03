import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { gzip } from 'node:zlib';

import {
  HeadObjectCommand,
  NotFound,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

const gzipAsync = promisify(gzip);

export const LOG_ARCHIVE_OPTIONS = Symbol('LOG_ARCHIVE_OPTIONS');

export interface LogArchiveOptions {
  /** Directory where pino-roll writes the log files. */
  dir: string;
  bucket: string;
  /** Root of the keys, e.g. "logs". */
  prefix: string;
}

interface LogFile {
  name: string;
  path: string;
  size: number;
  modifiedAt: number;
}

/** A file not modified for this long is no longer being written. */
const SETTLE_TIME_MS = 60_000;
const SOURCE_SIZE_METADATA = 'source-size';
const FILE_DATE = /\.(\d{4}-\d{2}-\d{2})/;
/** Minute 5 of every hour (00:05, 01:05, ...). */
const UPLOAD_SCHEDULE = '0 2 * * * *';

/**
 * Uploads the rotated (closed) log files to the bucket, gzipped, as
 * "<prefix>/<date>/<file>.gz". The active file is skipped: it is
 * uploaded once pino-roll rotates it (every hour). Uploads are idempotent, so
 * a failed run is simply retried on the next one.
 */
@Injectable()
export class LogArchiver implements OnApplicationBootstrap {
  private readonly logger = new Logger(LogArchiver.name);
  private running = false;
  /** File name → size already in the bucket; avoids asking it every run. */
  private readonly archived = new Map<string, number>();

  constructor(
    private readonly s3: S3Client,
    @Inject(LOG_ARCHIVE_OPTIONS) private readonly options: LogArchiveOptions,
  ) {}

  onApplicationBootstrap(): void {
    // Uploads whatever was left by a previous run, without delaying startup.
    void this.archive();
  }

  // Files rotate on the hour, so at minute 5 the previous one is closed.
  @Cron(UPLOAD_SCHEDULE)
  async archive(): Promise<void> {
    if (this.running) {
      return;
    }
    this.running = true;

    try {
      const files = await this.closedLogFiles();
      // Forget the files pino-roll already deleted from disk.
      const names = new Set(files.map((file) => file.name));
      for (const name of this.archived.keys()) {
        if (!names.has(name)) this.archived.delete(name);
      }

      for (const file of files) {
        try {
          await this.upload(file);
        } catch (error) {
          this.logger.error(
            `Could not archive ${file.name}`,
            error instanceof Error ? error.stack : String(error),
          );
        }
      }
    } catch (error) {
      this.logger.error(
        'Could not list the log files',
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      this.running = false;
    }
  }

  private async closedLogFiles(): Promise<LogFile[]> {
    const names = (await this.listDir()).filter((name) =>
      name.endsWith('.log'),
    );
    const files = await Promise.all(
      names.map(async (name): Promise<LogFile> => {
        const path = join(this.options.dir, name);
        const { size, mtimeMs } = await stat(path);
        return { name, path, size, modifiedAt: mtimeMs };
      }),
    );

    // The most recently modified file is the one pino-roll is writing to.
    const [, ...rotated] = files.sort((a, b) => b.modifiedAt - a.modifiedAt);
    return rotated.filter(
      (file) => Date.now() - file.modifiedAt >= SETTLE_TIME_MS,
    );
  }

  /** On the very first start pino-roll may not have created the dir yet. */
  private async listDir(): Promise<string[]> {
    try {
      return await readdir(this.options.dir);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  private async upload(file: LogFile): Promise<void> {
    if (this.archived.get(file.name) === file.size) {
      return;
    }

    const date = FILE_DATE.exec(file.name)?.[1] ?? 'undated';
    const key = `${this.options.prefix}/${date}/${file.name}.gz`;
    if (!(await this.isArchived(key, file.size))) {
      await this.put(key, file);
    }
    this.archived.set(file.name, file.size);
  }

  private async put(key: string, file: LogFile): Promise<void> {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.options.bucket,
        Key: key,
        Body: await gzipAsync(await readFile(file.path)),
        ContentType: 'application/gzip',
        Metadata: { [SOURCE_SIZE_METADATA]: String(file.size) },
      }),
    );
    this.logger.log(`Archived ${file.name} to ${key}`);
  }

  /** Compares sizes so a file that grew after being uploaded is re-uploaded. */
  private async isArchived(key: string, size: number): Promise<boolean> {
    try {
      const head = await this.s3.send(
        new HeadObjectCommand({ Bucket: this.options.bucket, Key: key }),
      );
      return head.Metadata?.[SOURCE_SIZE_METADATA] === String(size);
    } catch (error) {
      if (error instanceof NotFound) {
        return false;
      }
      throw error;
    }
  }
}
