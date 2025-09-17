import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // --- Global Validation Pipe ---
  app.enableCors(); // Enable for CORS if needed
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strips away any properties not defined in the DTO
      forbidNonWhitelisted: true, // Throws an error if unknown properties are sent
      transform: true, // Automatically transform payloads to be DTO instances
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();