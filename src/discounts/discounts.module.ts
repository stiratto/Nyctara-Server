import { Module } from '@nestjs/common';
import { DiscountsService } from './discounts.service';
import { DiscountsController } from './discounts.controller';
import { DatabaseService } from '../database/database.service';
@Module({
  controllers: [DiscountsController],
  providers: [DiscountsService, DatabaseService],
})
export class DiscountsModule {}
