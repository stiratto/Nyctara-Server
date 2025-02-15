import { IsString, IsNotEmpty, IsNumberString, IsDateString } from 'class-validator';

export class CreateDiscountDto {
  @IsString()
  @IsNotEmpty()
  discount_name: string;
  @IsNotEmpty()
  discount_total: number;
  @IsDateString()
  valid_until: Date;
}
