import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AdminService } from './modules/admin/admin.service';
import { SanitizePipe } from './common/pipes/sanitize.pipe';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Ensure uploads directory exists
  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Required for Stripe webhook signature verification
  });

  // Cookie parser for httpOnly refresh token cookies
  app.use(cookieParser());

  // Security headers via helmet
  // Defaults include: X-Content-Type-Options: nosniff, X-DNS-Prefetch-Control,
  // X-Download-Options, X-Permitted-Cross-Domain-Policies, X-XSS-Protection.
  // X-Frame-Options is set to SAMEORIGIN by default; override to DENY below.
  // Strict-Transport-Security (HSTS) is enabled here; ensure the API is always
  // served over TLS in staging and production.
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    frameguard: { action: 'deny' }, // X-Frame-Options: DENY
    hsts: {
      // Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
      maxAge: 31536000, // 1 year in seconds
      includeSubDomains: true,
      preload: true,
    },
    contentSecurityPolicy: false, // CSP managed by Next.js frontend; API is JSON-only
  }));

  // Request ID middleware — attach unique ID to every request
  app.use((req: any, _res: any, next: any) => {
    req.headers['x-request-id'] =
      req.headers['x-request-id'] || uuidv4();
    next();
  });

  // CORS origin configuration.
  // Development: CORS_ORIGIN env var may be a comma-separated list (e.g. "http://localhost:3000,http://localhost:3001").
  // Production: CORS_ORIGIN MUST be set to an explicit, exhaustive list of allowed origins.
  //   Do NOT use a wildcard ('*') in production as credentials: true is set.
  //   Example: CORS_ORIGIN=https://app.socialbounty.io,https://www.socialbounty.io
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
    credentials: true,
    maxAge: 86400,
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new SanitizePipe(),
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Wire error recording into the exception filter so all errors appear on System Health page
  const adminService = app.get(AdminService);
  app.useGlobalFilters(new HttpExceptionFilter(adminService));

  // Graceful shutdown
  app.enableShutdownHooks();

  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`Social Bounty API running on port ${port}`);
}

bootstrap();
