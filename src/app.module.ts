import {
  MiddlewareConsumer,
  Module,
  NestModule,
  OnModuleInit,
} from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { HeadersMiddleware } from './headers/headers.middleware';
import { ImageOptimizerService } from './image-optimizer/image-optimizer.service';
import { DiscountsModule } from './discounts/discounts.module';
import configuration from '../config/configuration.ts';

@Module({
  imports: [
    AuthModule,
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    ProductsModule,
    CategoriesModule,
    DiscountsModule,
  ],
  providers: [ImageOptimizerService],
})
export class AppModule implements NestModule {
  constructor(private readonly imageOptimizerService: ImageOptimizerService) {}

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HeadersMiddleware).forRoutes('*'); // Aplica a todas las rutas
  }
}
