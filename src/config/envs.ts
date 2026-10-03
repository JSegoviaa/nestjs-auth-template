import 'dotenv/config';
import joi from 'joi';

interface EnvVars {
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
}

const envsSchema = joi
  .object({
    PORT: joi.number().required(),
    DATABASE_URL: joi.string().required(),
    // Different secrets so a refresh token can never be used as an access
    // token (and vice versa).
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
    // Initial root user, created on startup if missing. Optional, but email
    // and password must be set together.
    // tlds: false so internal domains like "root@company.local" are allowed.
    ROOT_USER_EMAIL: joi.string().email({ tlds: { allow: false } }),
    ROOT_USER_PASSWORD: joi.string().min(8),
    ROOT_USER_FIRST_NAME: joi.string().default('Root'),
    ROOT_USER_LAST_NAME: joi.string().default('User'),
  })
  .and('ROOT_USER_EMAIL', 'ROOT_USER_PASSWORD')
  .unknown(true);

const { error, value } = envsSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const envVars: EnvVars = value;

export const ENVS = {
  CONFIG: { PORT: envVars.PORT },
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
};
