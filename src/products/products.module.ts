import { forwardRef, Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { DatabaseService } from '../database/database.service';
import { BucketService } from 'src/amazon-bucket/bucket.service';
import { CategoriesModule } from 'src/categories/categories.module';
import { DatabaseModule } from 'src/database/database.module';
import { BucketModule } from 'src/amazon-bucket/bucket.module';

@Module({
  imports: [forwardRef(() => CategoriesModule), DatabaseModule, BucketModule],
  controllers: [ProductsController],
  providers: [ProductsService],
})

export class ProductsModule { }
