import {
  DeleteObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3';
import { Logger } from '@nestjs/common';

import { LogBucketCleaner } from './log-bucket-cleaner.service.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const daysAgo = (days: number) => new Date(Date.now() - days * DAY_MS);

describe('LogBucketCleaner', () => {
  let send: ReturnType<typeof vi.fn>;
  let logError: ReturnType<typeof vi.spyOn>;
  let cleaner: LogBucketCleaner;

  /** Each call to ListObjectsV2 returns the next page. */
  const listPages = (
    ...pages: { Key: string; LastModified: Date }[][]
  ): void => {
    send.mockImplementation((command: unknown) => {
      if (command instanceof ListObjectsV2Command) {
        const index = Number(command.input.ContinuationToken ?? 0);
        const isLast = index === pages.length - 1;
        return Promise.resolve({
          Contents: pages[index],
          NextContinuationToken: isLast ? undefined : String(index + 1),
        });
      }
      return Promise.resolve({});
    });
  };

  const deletedKeys = () =>
    send.mock.calls
      .map(([command]) => command)
      .filter((command) => command instanceof DeleteObjectCommand)
      .map((command: DeleteObjectCommand) => command.input.Key);

  beforeEach(() => {
    vi.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    logError = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    send = vi.fn();
    cleaner = new LogBucketCleaner({ send } as unknown as S3Client, {
      bucket: 'cms-logs',
      prefix: 'logs/',
      retentionDays: 30,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deletes only the files older than the retention period', async () => {
    listPages([
      { Key: 'logs/host-1/app.2026-08-01.1.log.gz', LastModified: daysAgo(31) },
      { Key: 'logs/host-1/app.2026-09-20.1.log.gz', LastModified: daysAgo(12) },
      { Key: 'logs/host-2/app.2026-08-02.1.log.gz', LastModified: daysAgo(45) },
    ]);

    await cleaner.deleteExpired();

    expect(deletedKeys()).toEqual([
      'logs/host-1/app.2026-08-01.1.log.gz',
      'logs/host-2/app.2026-08-02.1.log.gz',
    ]);
    const list = send.mock.calls[0][0] as ListObjectsV2Command;
    expect(list.input).toMatchObject({ Bucket: 'cms-logs', Prefix: 'logs/' });
  });

  it('goes through every page of the listing', async () => {
    listPages(
      [{ Key: 'logs/a.log.gz', LastModified: daysAgo(40) }],
      [{ Key: 'logs/b.log.gz', LastModified: daysAgo(40) }],
    );

    await cleaner.deleteExpired();

    expect(deletedKeys()).toEqual(['logs/a.log.gz', 'logs/b.log.gz']);
  });

  it('logs the error instead of throwing when the bucket fails', async () => {
    send.mockRejectedValue(new Error('timeout'));

    await expect(cleaner.deleteExpired()).resolves.toBeUndefined();
    expect(logError).toHaveBeenCalledWith(
      'Could not delete the expired log files',
      expect.any(String),
    );
  });
});
