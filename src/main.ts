import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { Request } from 'express';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as expressModule from 'express';
import 'dotenv/config';

interface RequestWithRawBody extends Request {
  rawBody?: string;
}

const express = expressModule;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable raw body for HMAC signature validation
  app.use(
    express.json({
      verify: (req, _res, buf: Buffer) => {
        (req as RequestWithRawBody).rawBody = buf.toString();
      },
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Joy Pay API')
    .setDescription('Payment Gateway API Documentation')
    .setVersion('1.0')
    .addApiKey(
      { type: 'apiKey', name: 'x-api-key', in: 'header' },
      'x-api-key',
    )
    .addApiKey(
      { type: 'apiKey', name: 'x-signature', in: 'header' },
      'x-signature',
    )
    .addApiKey(
      { type: 'apiKey', name: 'x-timestamp', in: 'header' },
      'x-timestamp',
    )
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
void bootstrap();
