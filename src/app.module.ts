import {
  MiddlewareConsumer,
  Module,
  NestModule,
  OnModuleInit,
} from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { ProductsModule } from './products/products.module';
import { HeadersMiddleware } from './headers/headers.middleware';
import { ImageOptimizerService } from './image-optimizer/image-optimizer.service';
import configuration from 'config/configuration';

@Module({
  imports: [
    AuthModule,
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    ProductsModule,
  ],
  providers: [ImageOptimizerService],
})
export class AppModule implements NestModule, OnModuleInit {
  constructor(private readonly imageOptimizerService: ImageOptimizerService) {}

  async onModuleInit() {
    await this.imageOptimizerService.optimizeImages();
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HeadersMiddleware).forRoutes('*'); // Aplica a todas las rutas
  }
}
