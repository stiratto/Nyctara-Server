export interface CustomFile {
  originalname: string;
  buffer: Buffer;
}

export class CreateProductDto {
  name: string;
  price: string;
  description: string;
  category_name: string;
  category: {
    id: string;
    category_name: string;
  };
  product_quality: string;
  notes: string[] | string;
  tags: string[] | string;
  images: CustomFile[] | string;
}
