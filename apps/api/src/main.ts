import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { existsSync } from 'fs';
import { join } from 'path';
import { AppModule } from './app.module';
import { getCorsOrigins } from './cors-origins';
import { UploadService } from './upload/upload.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
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
      console.warn(`Care guide assets not found (${subdir}); static files may 404`);
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
  app.enableCors({
    origin: getCorsOrigins(),
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Plant Care API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
}
bootstrap();
