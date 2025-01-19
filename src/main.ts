import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './filters/all-exception-filter';
import { ValidationPipe } from '@nestjs/common';
import compression = require("compression")


async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
    logger: ['error', 'warn', 'log'],
  });
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
  app.use(compression());


  // const port = process.env.PORT || 4000;
  await app.listen(4000, '0.0.0.0');
}
bootstrap();
