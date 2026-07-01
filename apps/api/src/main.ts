import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { existsSync } from 'fs';
import { join } from 'path';
import { AppModule } from './app.module';
import { assertProductionSecrets } from './assert-production-secrets';
import { getCorsOrigins } from './cors-origins';
import { UploadService } from './upload/upload.service';
import { initSentry } from './observability/sentry';
import { requestIdMiddleware } from './observability/request-id.middleware';
import { accessLogMiddleware } from './observability/access-log.middleware';
import { AllExceptionsFilter } from './observability/all-exceptions.filter';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  assertProductionSecrets();
  await initSentry();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });
  app.set('trust proxy', 1);
  // Correlation id first, so every downstream log line and error carries it.
  app.use(requestIdMiddleware);
  app.use(accessLogMiddleware);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many auth attempts, please try again later.' },
  });
  const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many password reset requests, please try again later.' },
  });
  app.use('/api/v1/auth/login', authLimiter);
  app.use('/api/v1/auth/register', authLimiter);
  app.use('/api/v1/auth/forgot-password', passwordResetLimiter);
  app.use('/api/v1/auth/resend-verification', passwordResetLimiter);
  const uploadService = app.get(UploadService);
  app.useStaticAssets(uploadService.getUploadDir(), { prefix: '/uploads/' });
  const resolveCarePath = (subdir: string) => {
    const apiRoot = join(__dirname, '..');
    const candidates = [
      join(__dirname, 'care-guides', subdir),
      join(apiRoot, 'src', 'care-guides', subdir),
      join(apiRoot, 'dist', 'care-guides', subdir),
      join(process.cwd(), 'apps', 'api', 'src', 'care-guides', subdir),
      join(process.cwd(), 'apps', 'api', 'dist', 'care-guides', subdir),
      join(process.cwd(), 'src', 'care-guides', subdir),
      join(process.cwd(), 'dist', 'care-guides', subdir),
    ];
    const resolved = candidates.find((p) => existsSync(p));
    if (!resolved) {
      logger.warn(`Care guide assets not found (${subdir}); static files may 404`);
    }
    return resolved ?? candidates[1];
  };
  app.useStaticAssets(resolveCarePath('images'), { prefix: '/care-guides/images/' });
  app.useStaticAssets(resolveCarePath('photos'), { prefix: '/care-guides/photos/' });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  // Structured error logs + Sentry reporting on failures (access logs are emitted by
  // accessLogMiddleware above).
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableCors({
    origin: getCorsOrigins(),
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Dr. Plant API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));

  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`API running on http://localhost:${port}`);
}
bootstrap();
