import { DiscountsService } from './discounts.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import {
  Controller,
  Get,
  Post,
  Body, Param,
  Delete
} from '@nestjs/common';
import { Discount } from './interfaces/discount.interfaces';

@Controller('api/discounts')
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}


  @Get('getDiscount/:discount_name')
  getSingleDiscount(@Param('discount_name') discount_name: string): Promise<Discount> {
    return this.discountsService.getSingleDiscount(discount_name);
  }

  @Get('all')
  getAllDiscounts(): Promise<Discount[]> {
    return this.discountsService.getAllDiscounts();
  }

  @Post('create-discount')
  createDiscount(@Body() createDiscountDto: CreateDiscountDto): Promise<Discount> {
    return this.discountsService.createDiscount(createDiscountDto);
  }

  @Delete(':id')
  deleteDiscount(@Param('id') id: string): Promise<Discount> {
    return this.discountsService.deleteDiscount(id);
  }
}
