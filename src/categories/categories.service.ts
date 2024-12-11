import {
  Injectable,
  InternalServerErrorException
} from '@nestjs/common';
import {
  GetObjectCommand,
  S3Client,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { CustomFile } from '../products/dto/create-product.dto';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { CreateCategoryDto } from './dto/create-category.dto';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class CategoriesService {
  constructor(
    private prisma: DatabaseService,
    private config: ConfigService,
  ) {}

  private s3 = new S3Client({
    region: this.config.get<string>('amazon_s3.bucket_region'),
    credentials: {
      accessKeyId: this.config.get<string>('amazon_s3.access_key'),
      secretAccessKey: this.config.get<string>('amazon_s3.secret_access_key'),
    },
  });

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
      // Fetch the existing product
      // Transform the file into a CustomFile object
      const rawFile: CustomFile | string = image as any;
      const file: CustomFile | null =
        typeof rawFile === 'string'
          ? ({
              originalname: rawFile,
              buffer: Buffer.from(rawFile),
            } as CustomFile)
          : (rawFile as CustomFile);

      // Process and upload the file to S3 if there is a new file
      let imageTransformed: string | null = null;
      if (file) {
        const fileExtName = extname(file.originalname);
        const randomname = `${uuidv4()}${fileExtName}`;
        const params = {
          Bucket: this.config.get<string>('amazon_s3.bucket_name'),
          Key: randomname,
          Body: file.buffer,
        };
        const command = new PutObjectCommand(params);
        await this.s3.send(command);
        imageTransformed = command.input.Key;
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
    }
  }
  async createNewCategory(cat: CreateCategoryDto, file: Express.Multer.File) {
    const newCategoryName = cat.category_name;

    const fileExtName = extname(file.originalname);

    const randomname = `${uuidv4()}${fileExtName}`;

    const params = {
      Bucket: this.config.get<string>('amazon_s3.bucket_name'),
      Key: randomname,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    const command = new PutObjectCommand(params);

    try {
      await this.s3.send(command);

      const category = await this.prisma.category.create({
        data: {
          category_name: newCategoryName,
          image: command.input.Key,
        },
      });

      return category;
    } catch (err: any) {
      throw new InternalServerErrorException({
        message: err.message as string,
        status: 500,
      });
    }
  }

  async getAllCategories() {
    try {
      const categories = await this.prisma.category.findMany();

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

      // Array to store all the promises for getting signed URLs
      const urlPromises = categories.map(async (category) => {
        const getObjectParams = {
          Bucket: this.config.get<string>('amazon_s3.bucket_name'),
          Key: category.image,
        };

        const command = new GetObjectCommand(getObjectParams);
        const url = await getSignedUrl(this.s3, command, { expiresIn: 3600 });

        // Assign the URL to the category object
        category.imageUrl = url;
      });

      // Wait for all promises to resolve
      await Promise.all(urlPromises);

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
      const getObjectParams = {
        Bucket: this.config.get<string>('amazon_s3.bucket_name'),
        Key: category.image,
      };

      const command = new GetObjectCommand(getObjectParams);
      const url = await getSignedUrl(this.s3, command, { expiresIn: 3600 });

      // Assign the URL to the category object
      category.imageUrl = url;

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
        throw new InternalServerErrorException('Category not found');
      }

      const bucketName = this.config.get<string>('amazon_s3.bucket_name');

      if (!bucketName) {
        throw new InternalServerErrorException('Bucket name not configured');
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
              }
            }
          }
        });

        for (const product of products) {
          const productImagesUrls: string[] = [];
          for (const image of product.images) {
            const getObjectParams = {
              Bucket: bucketName,
              Key: image,
            };

            const command = new GetObjectCommand(getObjectParams);
            const url = await getSignedUrl(this.s3, command, {
              expiresIn: 3600,
            });

            productImagesUrls.push(url);
          }
          product.imageUrl = productImagesUrls;
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
