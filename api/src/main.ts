import 'dotenv/config';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ErrorFilter } from './common/error.filter';

export function configure(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new ErrorFilter());
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configure(app);
  await app.listen(process.env.PORT ?? 3000);
}
if (require.main === module) void bootstrap();
