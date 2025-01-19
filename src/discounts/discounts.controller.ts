import { DiscountsService } from './discounts.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { Discount } from './interfaces/discount.interfaces';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('api/discounts')
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) { }

  @Get('/discount-name/:discount_name')
  getSingleDiscount(
    @Param('discount_name') discount_name: string,
  ): Promise<Discount> {
    Logger.log(
      `::: Discounts Controller ::: getSingleDiscount(): ${discount_name}`,
    );
    return this.discountsService.getSingleDiscount(discount_name);
  }

  @Get('all')
  getAllDiscounts(): Promise<Discount[]> {
    Logger.log(`::: Discounts Controller ::: getAllDiscounts()`);
    return this.discountsService.getAllDiscounts();
  }

  @UseGuards(AuthGuard)
  @Post('create-discount')
  createDiscount(
    @Body() createDiscountDto: CreateDiscountDto,
  ): Promise<Discount> {
    Logger.log(`::: Discounts Controller ::: createDiscount()`);
    return this.discountsService.createDiscount(createDiscountDto);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  deleteDiscount(@Param('id') id: string): Promise<Discount> {
    Logger.log(`::: Discounts Controller ::: deleteDiscount(): ${id}`);
    return this.discountsService.deleteDiscount(id);
  }
}
