export class CreateProductDto {
  name: string;
  price: string;
  description: string;
  category: {
    id: string;
    category_name: string;
  };
  notes: string[] | string;
  tags: string[] | string;
  image: string;
}
