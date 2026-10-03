import {
  DeleteObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

export const LOG_BUCKET_CLEANUP_OPTIONS = Symbol('LOG_BUCKET_CLEANUP_OPTIONS');

export interface LogBucketCleanupOptions {
  bucket: string;
  prefix: string;
  retentionDays: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Deletes the archived log files older than the retention period, once a day.
 * Age is measured from the upload date. It runs at 3 AM server time (set the
 * TZ env var to choose the time zone).
 */
@Injectable()
export class LogBucketCleaner {
  private readonly logger = new Logger(LogBucketCleaner.name);

  constructor(
    private readonly s3: S3Client,
    @Inject(LOG_BUCKET_CLEANUP_OPTIONS)
    private readonly options: LogBucketCleanupOptions,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM, { timeZone: 'America/Cancun' })
  async deleteExpired(): Promise<void> {
    const cutoff = Date.now() - this.options.retentionDays * DAY_MS;
    let deleted = 0;

    try {
      for await (const key of this.expiredKeys(cutoff)) {
        await this.s3.send(
          new DeleteObjectCommand({ Bucket: this.options.bucket, Key: key }),
        );
        deleted++;
      }
    } catch (error) {
      this.logger.error(
        'Could not delete the expired log files',
        error instanceof Error ? error.stack : String(error),
      );
    }

    if (deleted) {
      this.logger.log(
        `Deleted ${deleted} log files older than ${this.options.retentionDays} days`,
      );
    }
  }

  private async *expiredKeys(cutoff: number): AsyncGenerator<string> {
    let continuationToken: string | undefined;
    do {
      const page = await this.s3.send(
        new ListObjectsV2Command({
          Bucket: this.options.bucket,
          Prefix: this.options.prefix,
          ContinuationToken: continuationToken,
        }),
      );
      for (const object of page.Contents ?? []) {
        if (
          object.Key &&
          object.LastModified &&
          +object.LastModified < cutoff
        ) {
          yield object.Key;
        }
      }
      continuationToken = page.NextContinuationToken;
    } while (continuationToken);
  }
}
