import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { ProductsModule } from './products/products.module';
import { PrismaService } from './products/prisma.service';
import configuration from 'config/configuration';

@Module({
  imports: [AuthModule, ConfigModule.forRoot({
    load: [configuration],
    isGlobal: true,
  }), ProductsModule],
  
})
export class AppModule {}
