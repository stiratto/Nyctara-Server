import { IsString, IsUUID } from "class-validator"

export class UpdateCategoryDto {
  @IsString()
  @IsUUID()
  id: string;
  @IsString()
  category_name: string;
}
