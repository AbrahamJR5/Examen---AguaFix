import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Controllers preserve /api routes and expose the exam's /reports route.
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
