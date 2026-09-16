import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

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

  // A misspelt origin is invisible from the server side and shows up in the
  // browser as an unexplained CORS failure, so record what was actually allowed.
  new Logger('Bootstrap').log(`CORS allows: ${allowedOrigins.join(', ')}`);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
