import { IsString, IsNotEmpty, IsNumberString } from 'class-validator';

export class CreateDiscountDto {
  @IsString()
  @IsNotEmpty()
  discount_name: string;

  @IsNumberString()
  @IsNotEmpty()
  discount_total: string;
}
