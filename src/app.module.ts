import {
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { HeadersMiddleware } from './headers/headers.middleware';
import { DiscountsModule } from './discounts/discounts.module';
import {configuration} from '../config/configuration';
import { DatabaseModule } from './database/database.module';

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
    DatabaseModule
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HeadersMiddleware).forRoutes('*'); // Aplica a todas las rutas
  }
}
