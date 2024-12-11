export interface Product {
    name: string;
    id: string;
    price: string;
    description: string;
    category: {
      id: string;
      category_name: string;
    };
    product_quality: string;
    images: string[]
    imageUrl: string[]
    notes: string[];
    tags: string[];
}

export interface ProductFiles {
    existingImages?: string[];
    newImages?: Express.Multer.File[];
}
