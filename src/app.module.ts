import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { DiscountsModule } from './discounts/discounts.module';
import { configuration } from '../config/configuration';
import { DatabaseModule } from './database/database.module';
import { BucketModule } from './amazon-bucket/bucket.module';
import { HeadersMiddleware } from './headers/headers.middleware';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksModule } from './crons/crons.module';
import { PaymentsModule } from './payment/payment.module';
import { MailingModule } from './mailing/mailing.module';

@Module({
  imports: [
    AuthModule,
    ScheduleModule.forRoot(),
    TasksModule,
    JwtModule.register({
      global: true,
      secret: `${process.env.JWT_SECRET}`,
      signOptions: { expiresIn: '60s' },
    }),
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    ProductsModule,
    CategoriesModule,
    DiscountsModule,
    BucketModule,
    DatabaseModule,
    PaymentsModule,
    MailingModule
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HeadersMiddleware).forRoutes('*'); // Aplica a todas las rutas
  }
}
