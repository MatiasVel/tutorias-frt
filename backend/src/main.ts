import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { assertEncryptionKey } from './common/utils/field-crypto';

async function bootstrap() {
  // Falla al arrancar si falta la clave de cifrado (mejor que fallar con datos a medio guardar)
  assertEncryptionKey();
  for (const v of ['JWT_ACCESS_SECRET', 'PASSWORD_PEPPER']) {
    if (!process.env[v] || process.env[v]!.length < 32) {
      throw new Error(`Falta ${v} o es demasiado corto (mínimo 32 caracteres)`);
    }
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // Detrás de nginx / Vercel: necesario para obtener la IP real (rate limit, auditoría)
  app.set('trust proxy', process.env.VERCEL ? true : 1);
  app.disable('x-powered-by');

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] },
      },
      crossOriginResourcePolicy: { policy: 'same-site' },
      hsts: { maxAge: 31536000, includeSubDomains: true },
    }),
  );
  app.use(cookieParser());

  const origins = (process.env.FRONTEND_URL ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim());
  app.enableCors({
    origin: origins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // descarta campos no declarados en los DTO
      forbidNonWhitelisted: true, // y rechaza la petición si llegan
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.enableShutdownHooks();

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  Logger.log(`API escuchando en http://localhost:${port}/api`, 'Bootstrap');
}
bootstrap();
