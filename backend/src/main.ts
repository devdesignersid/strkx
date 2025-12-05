import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';

import { Logger } from 'nestjs-pino';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { PrismaClientExceptionFilter } from './common/filters/prisma-client-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Security & Performance
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // Logging
  app.useLogger(app.get(Logger));

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalFilters(new PrismaClientExceptionFilter());
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalInterceptors(new LoggingInterceptor());

  app.enableShutdownHooks();

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
void bootstrap();
