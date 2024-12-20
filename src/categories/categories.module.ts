import { forwardRef, Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { DatabaseService } from 'src/database/database.service';
import { BucketService } from 'src/amazon-bucket/bucket.service';
import { BucketModule } from 'src/amazon-bucket/bucket.module';

@Module({
  imports: [forwardRef(() => BucketModule)],
  controllers: [CategoriesController],
  providers: [CategoriesService, DatabaseService, BucketService],
  exports: [CategoriesService]
})
export class CategoriesModule { }
