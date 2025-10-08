import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Obtener ConfigService
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;
  const frontendUrl =
    configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';

  // Habilitar CORS para el frontend
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  // Validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(port);
  logger.log(`🚀 Backend ejecutándose en http://localhost:${port}`);
  logger.log(`🌐 CORS habilitado para: ${frontendUrl}`);
  logger.log(`🔌 WebSocket disponible en ws://localhost:${port}`);
}
bootstrap();
