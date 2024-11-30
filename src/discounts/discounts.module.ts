import { Module } from '@nestjs/common';
import { DiscountsService } from './discounts.service';
import { DiscountsController } from './discounts.controller';
import { PrismaService } from '../products/prisma.service';

@Module({
  controllers: [DiscountsController],
  providers: [DiscountsService, PrismaService],
})
export class DiscountsModule {}
