import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './configure-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOrigins = configureApp(app);

  // A misspelt origin is invisible from the server side and shows up in the
  // browser as an unexplained CORS failure, so record what was actually allowed.
  new Logger('Bootstrap').log(`CORS allows: ${allowedOrigins.join(', ')}`);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
