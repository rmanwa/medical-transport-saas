import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// Load .env without extra deps (Node supports this)
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env' });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
