import { Prisma } from "@prisma/client";

export interface Product {
  id: string;
  product_name: string;
  product_price: Prisma.Decimal;
  product_description: string;
  product_category: {
    id: string;
    category_name: string;
  };
  product_quality: string;
  product_images: string[]
  product_notes: string[];
  product_tags: string[];
  createdAt?: Date;
  updatedAt?: Date
}

export interface ProductFiles {
  existingImages?: string[];
  newImages?: Express.Multer.File[];
}
