import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin
      if (!origin) {
        return callback(null, true);
      }

      const allowedOrigins = [
        'http://localhost:4200',
        'https://payal-hackathon-test.vercel.app',
      ];

      const isVercelPreview = /^https:\/\/payal-hackathon-test-[a-z0-9]+-payals-projects-73b17196\.vercel\.app$/.test(
        origin,
      );

      if (allowedOrigins.includes(origin) || isVercelPreview) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'), false);
    },

    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',

    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
    ],

    credentials: true,
  });

  // Basic Logging
  const logger = new Logger('Bootstrap');

  // Global Validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  // Global Exception Handling
  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
