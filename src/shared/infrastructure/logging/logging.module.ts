import { resolve } from 'node:path';

import { S3Client } from '@aws-sdk/client-s3';
import { Logger, Module, OnModuleInit, Provider } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerModule } from 'nestjs-pino';

import { ENVS } from '../../../config/envs.js';
import {
  LOG_ARCHIVE_OPTIONS,
  LogArchiver,
  type LogArchiveOptions,
} from './log-archiver.service.js';
import {
  LOG_BUCKET_CLEANUP_OPTIONS,
  LogBucketCleaner,
  type LogBucketCleanupOptions,
} from './log-bucket-cleaner.service.js';
import { pinoHttpOptions } from './pino-http.options.js';

const r2 = ENVS.CLOUDFLARE.R2;

/** Files are uploaded to "logs/<date>/". */
const BUCKET_PREFIX = 'logs';

const archiveProviders: Provider[] = r2
  ? [
      {
        provide: S3Client,
        useFactory: () =>
          new S3Client({
            endpoint: r2.ENDPOINT,
            region: r2.REGION,
            credentials: {
              accessKeyId: r2.ACCESS_KEY_ID,
              secretAccessKey: r2.SECRET_ACCESS_KEY,
            },
            // Required by RustFS/MinIO; supported by R2 too.
            forcePathStyle: true,
          }),
      },
      {
        provide: LOG_ARCHIVE_OPTIONS,
        useValue: {
          dir: resolve(ENVS.LOGS.DIR),
          bucket: r2.LOGS_BUCKET,
          prefix: BUCKET_PREFIX,
        } satisfies LogArchiveOptions,
      },
      {
        provide: LOG_BUCKET_CLEANUP_OPTIONS,
        useValue: {
          bucket: r2.LOGS_BUCKET,
          prefix: `${BUCKET_PREFIX}/`,
          retentionDays: ENVS.LOGS.BUCKET_RETENTION_DAYS,
        } satisfies LogBucketCleanupOptions,
      },
      LogArchiver,
      LogBucketCleaner,
    ]
  : [];

@Module({
  imports: [
    LoggerModule.forRoot({ pinoHttp: pinoHttpOptions() }),
    ScheduleModule.forRoot(),
  ],
  providers: archiveProviders,
})
export class LoggingModule implements OnModuleInit {
  onModuleInit(): void {
    if (!r2) {
      new Logger(LoggingModule.name).warn(
        'Log archiving disabled: CLOUDFLARE_R2_* variables are not set',
      );
    }
  }
}
