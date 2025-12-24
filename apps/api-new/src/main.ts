import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"
import { ValidationPipe } from '@nestjs/common';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOrigins = process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',') 
    : ['http://localhost:3000'];

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe())

  const config = new DocumentBuilder().setTitle("aws-ticket api")
    .setDescription("AWS Cloud Club Nepal, Ticketing System")
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'jwt' // This is the security name used in @ApiBearerAuth()
    )
    .build();

  const document = SwaggerModule.createDocument(app, config)
  document.security = [{ 'jwt': [] }];
  SwaggerModule.setup('api/docs', app, document)

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
