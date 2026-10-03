import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ENVS } from './config/envs.js';
import { AllExceptionsFilter } from './shared/infrastructure/http/all-exceptions.filter.js';
import { RequestValidationException } from './shared/infrastructure/http/request-validation.exception.js';
import { requestIdMiddleware } from './shared/infrastructure/http/request-id.middleware.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  app.enableCors({ exposedHeaders: ['X-Request-Id'] });
  app.use(requestIdMiddleware);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: RequestValidationException.fromValidationErrors,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.setGlobalPrefix('api');
  await app.listen(ENVS.CONFIG.PORT);
}
await bootstrap();
