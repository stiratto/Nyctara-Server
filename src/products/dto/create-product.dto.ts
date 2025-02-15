import { Prisma } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsString, IsNotEmptyObject, IsArray, Length } from 'class-validator'

export interface CustomFile {
  originalname: string;
  buffer: Buffer;
}

export class CreateProductDto {
  @IsString()
  @Length(1, 40, { message: "El nombre debe estar entre 1 y 40 caracteres." })
  product_name: string;
  @IsString()
  product_price: Prisma.Decimal;
  @IsString()
  product_description: string;
  @Transform(({ value }) => JSON.parse(value))
  product_category: {
    id: string;
    category_name: string;
  };
  @IsString()
  product_quality: string;
  @IsArray()
  @IsString({ each: true })
  product_notes: string[];
  @IsArray()
  @IsString({ each: true })
  product_tags: string[];
  //product_images: any[]
  existingImages?: string[];
  newImages?: CustomFile[] | string;
}
