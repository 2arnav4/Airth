import { INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/http-exception.filter';

/**
 * Every cross-cutting behaviour of the API, in one place.
 *
 * main.ts and the e2e suite both call this, so a test can never pass against
 * a differently-configured app than the one that ships.
 */
export function configureApp(app: INestApplication): string[] {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  // Express adds a weak body-hash ETag to GET responses. We use ETag to mean
  // "job version", so two different meanings would share one header name.
  app.getHttpAdapter().getInstance().set('etag', false);

  // Only the deployed dashboard (and local dev) may call this API from a browser.
  const allowedOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'If-Match'],
    exposedHeaders: ['ETag'],
  });

  return allowedOrigins;
}
