import { Prisma } from "@prisma/client";

export interface Product {
  name: string;
  id: string;
  price: Prisma.Decimal;
  description: string;
  category: {
    id: string;
    category_name: string;
  };
  product_quality: string;
  images: string[]
  notes: string[];
  tags: string[];
  createdAt?: Date;
  updatedAt?: Date
}

export interface ProductFiles {
  existingImages?: string[];
  newImages?: Express.Multer.File[];
}
