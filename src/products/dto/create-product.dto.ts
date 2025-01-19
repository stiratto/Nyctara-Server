import { IsString, IsNotEmptyObject, IsArray } from 'class-validator'

export interface CustomFile {
  originalname: string;
  buffer: Buffer;
}

export class CreateProductDto {
  @IsString()
  name: string;
  @IsString()
  price: string;
  @IsString()
  description: string;
  @IsString()
  category_name: string;
  category: {
    id: string;
    category_name: string;
  };
  @IsString()
  product_quality: string;
  @IsArray()
  @IsString({ each: true })
  notes: string[];
  @IsArray()
  @IsString({ each: true })
  tags: string[];
  existingImages: string[];
  newImages: CustomFile[] | string;
}
