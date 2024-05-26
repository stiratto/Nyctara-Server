export class CreateProductDto {
  name: string;
  price: string;
  description: string;
  category: string;
  notes: string[] | string;
  tags: string[] | string;
  image: string;
}
