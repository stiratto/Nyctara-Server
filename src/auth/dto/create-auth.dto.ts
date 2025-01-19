import { Exclude } from "class-transformer";
import { IsString } from "class-validator"

export class CreateAuthDto {
  password: string;
}
