import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.use(cookieParser());

  const corsOptions = {
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    exposedHeaders: ['Authorization'],
    allowedHeaders: [
      'Origin',
      'X-Request-With',
      'Content-Type',
      'Accept',
      'Authorization',
    ],
  };

  app.enableCors(corsOptions);

  const config = new DocumentBuilder()
    .setTitle('TravleSpace')
    .setDescription('The TravleSpace API description')
    .setVersion('0.1')
    .addTag('TravleSpace')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(8080);
  console.log(`Application is running on port 8080`);
}

bootstrap();
