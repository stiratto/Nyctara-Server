import { forwardRef, Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { DatabaseService } from '../database/database.service';
import { BucketService } from 'src/amazon-bucket/bucket.service';
import { CategoriesModule } from 'src/categories/categories.module';

@Module({
  imports: [forwardRef(() => CategoriesModule)],
  controllers: [ProductsController],
  providers: [ProductsService, DatabaseService, BucketService],
})

export class ProductsModule { }
