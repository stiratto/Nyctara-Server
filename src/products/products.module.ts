import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { DatabaseService } from '../database/database.service';
@Module({
  imports: [],
  controllers: [ProductsController],
  providers: [ProductsService, DatabaseService],
})
export class ProductsModule {}
