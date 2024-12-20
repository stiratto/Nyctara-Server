import { forwardRef, Module } from '@nestjs/common';
import { BucketService } from './bucket.service';
import { CategoriesModule } from 'src/categories/categories.module';

@Module({
  imports: [forwardRef(() => CategoriesModule)],
  providers: [BucketService],
  exports: [BucketService]
})
export class BucketModule { }
