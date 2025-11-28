import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import * as express from 'express';
import { AppDataSource } from '@shared/database/data-source';

async function bootstrap() {
  // TEMPORARILY DISABLED: Run migrations before starting the app
  // The database schema has been rebuilt manually with enterprise-schema.sql
  // TODO: Update TypeORM entities to match new schema, then re-enable migrations
  /*
  console.log('Running database migrations...');
  try {
    await AppDataSource.initialize();
    await AppDataSource.runMigrations();
    console.log('✅ Migrations completed successfully');
    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    // Don't exit - let the app try to start anyway
    // This prevents the app from being completely down if migrations fail
  }
  */

  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Enable raw body for Stripe webhooks
  });

  const configService = app.get(ConfigService);

  // Security
  app.use(helmet());

  // CORS - Allow admin dashboard and other origins
  app.enableCors({
    origin: configService.get('CORS_ORIGIN', '*').split(',').map(o => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Only Coffee API')
    .setDescription(
      `API documentation for Only Coffee mobile ordering platform.

## Authentication
Most endpoints require Bearer token authentication. Use the login endpoint to obtain a token.

## Base URL
All endpoints are prefixed with \`/api/v1\`

## Rate Limiting
- 100 requests per minute per IP address

## Error Handling
All errors follow a consistent format with appropriate HTTP status codes.`,
    )
    .setVersion('1.0.0')
    .setContact(
      'Only Coffee Support',
      'https://onlycoffee.com',
      'support@onlycoffee.com',
    )
    .setLicense('Proprietary', 'https://onlycoffee.com/license')
    .addTag('auth', 'Authentication endpoints - Register, login, and token refresh')
    .addTag('users', 'User management - Profile and loyalty information')
    .addTag('stores', 'Store discovery and information - Find nearby stores')
    .addTag('menu', 'Menu items and customization - Browse and customize items')
    .addTag('orders', 'Order management - Create, track, and manage orders')
    .addTag('payments', 'Payment processing - Handle payments and payment methods')
    .addTag('rewards', 'Loyalty and rewards - Manage loyalty points and redemptions')
    .addTag('gifts', 'Gift cards and social gifting - Create and redeem gift cards')
    .addTag('reviews', 'Reviews and ratings - Submit and view reviews')
    .addTag('promotions', 'Promotions and campaigns - Get active promotions')
    .addTag('carousel', 'Carousel management - Manage home screen carousel images')
    .addTag('upload', 'File uploads - Upload images and files')
    .addTag('admin', 'Admin operations - Administrative functions')
    .addTag('health', 'Health checks - API health and status')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token',
      },
      'bearer',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayOperationId: true,
      filter: true,
      showRequestHeaders: true,
      docExpansion: 'list',
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,
    },
    customCss: `
      .topbar { display: none; }
      .swagger-ui .topbar { display: block; }
      .swagger-ui .info .title { font-size: 32px; }
      .swagger-ui .scheme-container { background: #fafafa; }
    `,
    customSiteTitle: 'Only Coffee API Documentation',
  });

  const port = configService.get('PORT', 3000);
  await app.listen(port);

  console.log(`
╔════════════════════════════════════════════════════════════╗
║          🚀 Only Coffee API Gateway Started 🚀             ║
╠════════════════════════════════════════════════════════════╣
║ API Server:        http://localhost:${port}                    ║
║ API Prefix:        /api/v1                                 ║
║ Swagger UI:        http://localhost:${port}/api/docs           ║
║ Health Check:      http://localhost:${port}/api/v1/health      ║
╚════════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
