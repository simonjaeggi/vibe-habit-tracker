import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';

export async function createApp(
  adapter?: ExpressAdapter,
): Promise<INestApplication> {
  let app: INestApplication;
  if (adapter) {
    app = await NestFactory.create(AppModule, adapter);
  } else {
    app = await NestFactory.create(AppModule);
  }
  const configService = app.get(ConfigService);

  const origins = configService
    .get<string>('FRONTEND_ORIGIN')
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: origins?.length ? origins : true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  return app;
}
