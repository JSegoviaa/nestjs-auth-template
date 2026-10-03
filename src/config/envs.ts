import 'dotenv/config';
import joi from 'joi';

interface EnvVars {
  NODE_ENV: 'development' | 'production' | 'test';
  TZ: string;
  PORT: number;
  DATABASE_URL: string;
  JWT_ACCESS_SECRET: string;
  JWT_ACCESS_EXPIRES_IN_SECONDS: number;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRES_IN_SECONDS: number;
  ROOT_USER_EMAIL?: string;
  ROOT_USER_PASSWORD?: string;
  ROOT_USER_FIRST_NAME: string;
  ROOT_USER_LAST_NAME: string;
  LOG_LEVEL: string;
  LOGS_DIR: string;
  LOGS_RETENTION_FILES: number;
  LOGS_MAX_FILE_SIZE: string;
  LOGS_BUCKET_RETENTION_DAYS: number;
  CLOUDFLARE_R2_ENDPOINT?: string;
  CLOUDFLARE_R2_REGION: string;
  CLOUDFLARE_R2_ACCESS_KEY_ID?: string;
  CLOUDFLARE_R2_SECRET_ACCESS_KEY?: string;
  CLOUDFLARE_R2_LOGS_BUCKET?: string;
}

const envsSchema = joi
  .object({
    NODE_ENV: joi
      .string()
      .valid('development', 'production', 'test')
      .default('development'),
    // Process time zone: log file rotation, cron jobs and console timestamps.
    TZ: joi
      .string()
      .custom((value: string) => {
        // Throws a RangeError for unknown IANA time zones.
        new Intl.DateTimeFormat('en', { timeZone: value });
        return value;
      })
      .default('America/Cancun'),
    PORT: joi.number().required(),
    DATABASE_URL: joi.string().required(),
    JWT_ACCESS_SECRET: joi.string().min(32).required(),
    JWT_ACCESS_EXPIRES_IN_SECONDS: joi
      .number()
      .integer()
      .positive()
      .default(900),
    JWT_REFRESH_SECRET: joi
      .string()
      .min(32)
      .invalid(joi.ref('JWT_ACCESS_SECRET'))
      .required(),
    JWT_REFRESH_EXPIRES_IN_SECONDS: joi
      .number()
      .integer()
      .positive()
      .default(604800),

    ROOT_USER_EMAIL: joi.string().email({ tlds: { allow: false } }),
    ROOT_USER_PASSWORD: joi.string().min(8),
    ROOT_USER_FIRST_NAME: joi.string().default('Root'),
    ROOT_USER_LAST_NAME: joi.string().default('User'),
    LOG_LEVEL: joi
      .string()
      .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace')
      .default('info'),

    LOGS_DIR: joi.string().default('logs'),
    LOGS_RETENTION_FILES: joi.number().integer().positive().default(168),
    LOGS_MAX_FILE_SIZE: joi.string().default('50m'),
    LOGS_BUCKET_RETENTION_DAYS: joi.number().integer().positive().default(30),
    CLOUDFLARE_R2_ENDPOINT: joi.string().uri(),
    CLOUDFLARE_R2_REGION: joi.string().default('auto'),
    CLOUDFLARE_R2_ACCESS_KEY_ID: joi.string(),
    CLOUDFLARE_R2_SECRET_ACCESS_KEY: joi.string(),
    CLOUDFLARE_R2_LOGS_BUCKET: joi.string(),
  })
  .and('ROOT_USER_EMAIL', 'ROOT_USER_PASSWORD')
  .and(
    'CLOUDFLARE_R2_ENDPOINT',
    'CLOUDFLARE_R2_ACCESS_KEY_ID',
    'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
    'CLOUDFLARE_R2_LOGS_BUCKET',
  )
  .unknown(true);

const { error, value } = envsSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const envVars: EnvVars = value;

// Applies the default too when TZ is not set. Node picks up the change at once.
process.env.TZ = envVars.TZ;

export const ENVS = {
  CONFIG: { NODE_ENV: envVars.NODE_ENV, PORT: envVars.PORT },
  DATABASE: { URL: envVars.DATABASE_URL },
  JWT: {
    ACCESS_SECRET: envVars.JWT_ACCESS_SECRET,
    ACCESS_EXPIRES_IN_SECONDS: envVars.JWT_ACCESS_EXPIRES_IN_SECONDS,
    REFRESH_SECRET: envVars.JWT_REFRESH_SECRET,
    REFRESH_EXPIRES_IN_SECONDS: envVars.JWT_REFRESH_EXPIRES_IN_SECONDS,
  },
  ROOT_USER:
    envVars.ROOT_USER_EMAIL && envVars.ROOT_USER_PASSWORD
      ? {
          EMAIL: envVars.ROOT_USER_EMAIL,
          PASSWORD: envVars.ROOT_USER_PASSWORD,
          FIRST_NAME: envVars.ROOT_USER_FIRST_NAME,
          LAST_NAME: envVars.ROOT_USER_LAST_NAME,
        }
      : null,
  CLOUDFLARE: {
    R2:
      envVars.CLOUDFLARE_R2_ENDPOINT &&
      envVars.CLOUDFLARE_R2_ACCESS_KEY_ID &&
      envVars.CLOUDFLARE_R2_SECRET_ACCESS_KEY &&
      envVars.CLOUDFLARE_R2_LOGS_BUCKET
        ? {
            ENDPOINT: envVars.CLOUDFLARE_R2_ENDPOINT,
            REGION: envVars.CLOUDFLARE_R2_REGION,
            ACCESS_KEY_ID: envVars.CLOUDFLARE_R2_ACCESS_KEY_ID,
            SECRET_ACCESS_KEY: envVars.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
            LOGS_BUCKET: envVars.CLOUDFLARE_R2_LOGS_BUCKET,
          }
        : null,
  },
  LOGS: {
    LEVEL: envVars.LOG_LEVEL,
    DIR: envVars.LOGS_DIR,
    RETENTION_FILES: envVars.LOGS_RETENTION_FILES,
    MAX_FILE_SIZE: envVars.LOGS_MAX_FILE_SIZE,
    BUCKET_RETENTION_DAYS: envVars.LOGS_BUCKET_RETENTION_DAYS,
  },
};
