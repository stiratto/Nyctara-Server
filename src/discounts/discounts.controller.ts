import { DiscountsService } from './discounts.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Logger,
  UsePipes,
} from '@nestjs/common';

@Controller('api/discounts')
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @Get('getDiscount/:discount_name')
  getSingleDiscount(@Param('discount_name') discount_name: string) {
    return this.discountsService.getSingleDiscount(discount_name);
  }

  @Get('all')
  getAllDiscounts() {
    return this.discountsService.getAllDiscounts();
  }

  @Post('create-discount')
  createDiscount(@Body() createDiscountDto: CreateDiscountDto) {
    return this.discountsService.createDiscount(createDiscountDto);
  }

  @Delete(':id')
  deleteDiscount(@Param('id') id: string) {
    return this.discountsService.deleteDiscount(id);
  }
}
