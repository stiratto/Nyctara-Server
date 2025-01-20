import { Prisma } from '@prisma/client';
import { IsString, IsNotEmpty, IsNumberString, IsDateString } from 'class-validator';

export class CreateDiscountDto {
  @IsString()
  @IsNotEmpty()
  discount_name: string;
  @IsNotEmpty()
  discount_total: Prisma.Decimal;
  @IsDateString()
  valid_until: Date;
}
