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
        const file = await this.s3.createFile(image);
        imageTransformed = await this.s3.getSignedUrlsFromImages(file) as string;
      } else {
        imageTransformed = await this.s3.getSignedUrlsFromImages(image) as string;
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
      const newCategoryName = cat.category_name;

      let imagesToUpload: string[] = [];
      imagesToUpload.push(await this.s3.createFile(file));

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
      const categories = await this.prisma.category.findMany();

      for (const category of categories) {
        category.imageUrl = await this.s3.getSignedUrlsFromImages(
          category.image,
        ) as string;
      }

      return categories;
    } catch (err: any) {
      throw new InternalServerErrorException({
        message: err.message as string,
        status: 500,
      });
    }
  }

  async getAllCategoriesExcludingOne(category: string) {
    try {
      const categories = await this.prisma.category.findMany({
        where: {
          category_name: {
            not: category,
          },
        },
      });

      categories.forEach(async (category) => {
        const signedImages = await this.s3.getSignedUrlsFromImages(
          category.image,
        );
        category.imageUrl = signedImages as string;
      });

      return categories;
    } catch (err: any) {
      throw new InternalServerErrorException({
        message: err.message as string,
        status: 500,
      });
    }
  }

  async findCategoryById(id: string) {
    try {
      const category = await this.prisma.category.findFirst({
        where: {
          id: id,
        },
      });

      category.imageUrl = await this.s3.getSignedUrlsFromImages(category.image) as string;
      return category;
    } catch (error) {
      console.log(error);
    }
  }

  async findCategoryWithProducts(id: string) {
    // Encuentra los productos de una categoria
    try {
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
          const signedImages = await this.s3.getSignedUrlsFromImages(
            product.images,
          );
          product.imageUrl = signedImages as string[];
        }

        return products;
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
