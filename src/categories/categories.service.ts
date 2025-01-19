import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { DatabaseService } from 'src/database/database.service';
import { BucketService } from 'src/amazon-bucket/bucket.service';
import { Category, Product } from '@prisma/client';

@Injectable()
export class CategoriesService {
  constructor(
    private prisma: DatabaseService,
    @Inject(forwardRef(() => BucketService)) private s3: BucketService,
  ) { }

  isMulterFile(file: any): file is Express.Multer.File {
    return (
      file &&
      typeof file === 'object' &&
      'fieldname' in file &&
      'originalname' in file &&
      'mimetype' in file &&
      'buffer' in file &&
      'size' in file
    );
  };

  async updateCategory(
    id: string,
    image: Express.Multer.File | string,
    category_name: string,
  ) {
    try {
      const productToUpdate = await this.prisma.category.findFirst({
        where: {
          id: id,
        },
      });


      // Process and upload the file to S3 if there is a new file
      let imageTransformed: string | null = null;

      if (this.isMulterFile(image)) {
        const file = await this.s3.createFile('categories', image);
        imageTransformed = await this.s3.getSignedUrlsFromImages('categories', file) as string;
      } else {
        imageTransformed = await this.s3.getSignedUrlsFromImages('categories', image) as string;
      }

      // Use the new image if it exists, otherwise keep the existing one
      const updatedImage = imageTransformed
        ? imageTransformed
        : productToUpdate.image;

      const update = await this.prisma.category.update({
        where: {
          id: id,
        },
        data: {
          category_name: category_name,
          image: updatedImage,
        },
      });

      return update;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException("Couldn't update category, an error ocurred", err)
    }
  }

  async createNewCategory(cat: CreateCategoryDto, file: Express.Multer.File) {
    try {
      console.log(cat, file)
      const newCategoryName = cat.category_name;

      let imagesToUpload: string[] = [];
      imagesToUpload.push(await this.s3.createFile('categories', file));

      const category = await this.prisma.category.create({
        data: {
          category_name: newCategoryName,
          image: imagesToUpload[0],
        },
      });

      return category;
    } catch (error: any) {
      console.log(error);
      throw new InternalServerErrorException(error);
    }
  }

  async getAllCategories() {
    try {
      let categoriesToReturn: Category[] = [];
      const categories = await this.prisma.category.findMany();

      for (const category of categories) {
        let categoryToReturn = category
        categoryToReturn.image = await this.s3.getSignedUrlsFromImages('categories',
          category.image,
        ) as string;
        console.log(categoriesToReturn)
        categoriesToReturn.push(categoryToReturn)
      }

      console.log(categoriesToReturn)
      return categoriesToReturn;
    } catch (err: any) {
      throw new InternalServerErrorException({
        message: err.message as string,
        status: 500,
      });
    }
  }

  async getAllCategoriesExcludingOne(category: string) {
    try {
      let categoriesToReturn: Category[];
      const categories = await this.prisma.category.findMany({
        where: {
          category_name: {
            not: category,
          },
        },
      });

      categories.forEach(async (category) => {
        let categoryToReturn = category
        categoryToReturn.image = await this.s3.getSignedUrlsFromImages('categories',
          category.image,
        ) as string;
        categoriesToReturn.push(categoryToReturn)
      });

      return categoriesToReturn;
    } catch (err: any) {
      throw new InternalServerErrorException({
        message: err.message as string,
        status: 500,
      });
    }
  }

  async findCategoryById(id: string) {
    try {
      let categoryToReturn: Category
      const category = await this.prisma.category.findFirst({
        where: {
          id: id,
        },
      });
      categoryToReturn = category
      categoryToReturn.image = await this.s3.getSignedUrlsFromImages('categories', category.image) as string;
      return categoryToReturn;
    } catch (error) {
      console.log(error);
    }
  }

  async findCategoryWithProducts(id: string) {
    try {
      let productsToReturn = [];
      const category = await this.prisma.category.findFirst({
        where: {
          id: id,
        },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      try {
        const products = await this.prisma.product.findMany({
          where: {
            categoryId: category.id,
          },
          include: {
            category: {
              select: {
                category_name: true,
                id: true,
              },
            },
          },
        });

        for (const product of products) {
          let productToReturn = product;
          productToReturn.images = await this.s3.getSignedUrlsFromImages('products',
            product.images,
          ) as string[]
          productsToReturn.push(productToReturn)
        }



        return productsToReturn;
      } catch (err) {
        console.log(err);
        throw new Error('Error fetching products or generating signed URLs');
      }
    } catch (err: any) {
      throw new InternalServerErrorException({
        message: err.message as string,
        status: 500,
      });
    }
  }

  async deleteCategory(id: string) {
    try {
      const categoryToDelete = await this.prisma.category.findUnique({
        where: {
          id: id,
        },
      });

      if (!categoryToDelete) {
        throw new Error(`Couldn't find a category with that ID (${id})`);
      }

      await this.s3.deleteFile(categoryToDelete.image);

      const deletedCategory = await this.prisma.category.delete({
        where: {
          id: id,
        },
      });

      return deletedCategory;
    } catch (err: any) {
      throw new InternalServerErrorException({
        message: err.message as string,
        status: 500,
      });
    }
  }
}
