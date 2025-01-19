import { IsString } from "class-validator"

export class UpdateCategoryDto {
  @IsString()
  id: string;
  @IsString()
  category_name: string;
  @IsString()
  image: string;
}
