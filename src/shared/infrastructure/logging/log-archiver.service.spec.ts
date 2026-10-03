import { mkdtemp, rm, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';

import {
  HeadObjectCommand,
  NotFound,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Logger } from '@nestjs/common';

import { LogArchiver } from './log-archiver.service.js';

const HOUR = 60 * 60;

describe('LogArchiver', () => {
  let dir: string;
  let send: ReturnType<typeof vi.fn>;
  let archiver: LogArchiver;
  let logError: ReturnType<typeof vi.spyOn>;
  /** Objects already in the bucket: key → source-size metadata. */
  let bucket: Map<string, string>;

  const writeLog = async (
    name: string,
    content: string,
    ageSeconds: number,
  ) => {
    const path = join(dir, name);
    await writeFile(path, content);
    const time = Date.now() / 1000 - ageSeconds;
    await utimes(path, time, time);
  };

  const uploadedKeys = () =>
    send.mock.calls
      .map(([command]) => command)
      .filter((command) => command instanceof PutObjectCommand)
      .map((command: PutObjectCommand) => command.input.Key);

  beforeEach(async () => {
    vi.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    logError = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

    dir = await mkdtemp(join(tmpdir(), 'logs-'));
    bucket = new Map();
    send = vi.fn((command: unknown) => {
      if (command instanceof HeadObjectCommand) {
        const size = bucket.get(command.input.Key!);
        return size === undefined
          ? Promise.reject(new NotFound({ message: 'NotFound', $metadata: {} }))
          : Promise.resolve({ Metadata: { 'source-size': size } });
      }
      return Promise.resolve({});
    });
    archiver = new LogArchiver({ send } as unknown as S3Client, {
      dir,
      bucket: 'cms-logs',
      prefix: 'logs',
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(dir, { recursive: true, force: true });
  });

  it('uploads rotated files gzipped, never the active one', async () => {
    await writeLog(
      'app.2026-10-01-23.1.log',
      '{"msg":"yesterday"}\n',
      24 * HOUR,
    );
    await writeLog('app.2026-10-02-14.2.log', '{"msg":"today"}\n', 0);

    await archiver.archive();

    expect(uploadedKeys()).toEqual([
      'logs/2026-10-01/app.2026-10-01-23.1.log.gz',
    ]);
    const put = send.mock.calls
      .map(([command]) => command)
      .find(
        (command) => command instanceof PutObjectCommand,
      ) as PutObjectCommand;
    expect(put.input.Bucket).toBe('cms-logs');
    expect(put.input.Metadata).toEqual({ 'source-size': '20' });
    expect(gunzipSync(put.input.Body as Buffer).toString()).toBe(
      '{"msg":"yesterday"}\n',
    );
  });

  it('skips files already archived with the same size', async () => {
    await writeLog('app.2026-10-01-23.1.log', '{"msg":"a"}\n', 24 * HOUR);
    await writeLog('app.2026-10-02-14.2.log', '{"msg":"b"}\n', 0);
    bucket.set('logs/2026-10-01/app.2026-10-01-23.1.log.gz', '12');

    await archiver.archive();

    expect(uploadedKeys()).toEqual([]);
  });

  it('re-uploads a file that grew after being archived', async () => {
    await writeLog(
      'app.2026-10-01-23.1.log',
      '{"msg":"a"}\n{"msg":"b"}\n',
      24 * HOUR,
    );
    await writeLog('app.2026-10-02-14.2.log', '{"msg":"c"}\n', 0);
    bucket.set('logs/2026-10-01/app.2026-10-01-23.1.log.gz', '12');

    await archiver.archive();

    expect(uploadedKeys()).toEqual([
      'logs/2026-10-01/app.2026-10-01-23.1.log.gz',
    ]);
  });

  it('keeps archiving the rest when one upload fails', async () => {
    await writeLog('app.2026-09-30-23.1.log', '{"msg":"a"}\n', 48 * HOUR);
    await writeLog('app.2026-10-01-23.1.log', '{"msg":"b"}\n', 24 * HOUR);
    await writeLog('app.2026-10-02-14.1.log', '{"msg":"c"}\n', 0);
    send.mockImplementationOnce(() => Promise.reject(new Error('timeout')));

    await archiver.archive();

    expect(uploadedKeys()).toContain(
      'logs/2026-09-30/app.2026-09-30-23.1.log.gz',
    );
    expect(logError).toHaveBeenCalledWith(
      'Could not archive app.2026-10-01-23.1.log',
      expect.any(String),
    );
  });

  it('does not ask the bucket again for files it already uploaded', async () => {
    await writeLog('app.2026-10-01-23.1.log', '{"msg":"a"}\n', 24 * HOUR);
    await writeLog('app.2026-10-02-14.1.log', '{"msg":"b"}\n', 0);

    await archiver.archive();
    send.mockClear();
    await archiver.archive();

    expect(send).not.toHaveBeenCalled();
  });

  it('does nothing when the logs directory does not exist yet', async () => {
    await rm(dir, { recursive: true, force: true });

    await archiver.archive();

    expect(send).not.toHaveBeenCalled();
    expect(logError).not.toHaveBeenCalled();
  });
});
