import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { config as loadEnv } from 'dotenv';
import { join } from 'path';
import { existsSync } from 'fs';

// Load env reliably whether we run from repo root or apps/api
const candidates = [
  join(process.cwd(), 'apps', 'api', '.env'), // when started from repo root
  join(process.cwd(), '.env'),                // when started from apps/api
];

for (const p of candidates) {
  if (existsSync(p)) {
    loadEnv({ path: p });
    break;
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false,
      transform: true,
    }),
  );

  await app.listen(3000);
}
bootstrap();