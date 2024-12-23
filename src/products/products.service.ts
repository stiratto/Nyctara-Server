import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product, ProductFiles } from './interfaces/product.interfaces';
import { DatabaseService } from '../database/database.service';
import { BucketService } from 'src/amazon-bucket/bucket.service';

@Injectable()
export class ProductsService {
  /*    This lets us use the prisma functions in this service */
  constructor(
    private prisma: DatabaseService,
    private s3: BucketService,
  ) {}
  // Define the S3 client that will be used to interact with the S3 bucket

  async createItemPrisma(
    createProductDto: CreateProductDto,
    files: (Express.Multer.File | string)[],
  ) {
    try {
      const imagesTransformed: string[] = [];

      for (let file of files) {
        imagesTransformed.push(await this.s3.createFile(file));
      }

      // Create the product
      const product = await this.prisma.product.create({
        data: {
          name: createProductDto.name,
          description: createProductDto.description,
          notes: createProductDto.notes,
          category: {
            connect: {
              category_name: createProductDto.category_name,
            },
          },
          price: createProductDto.price,
          images: imagesTransformed,
          tags: createProductDto.tags,
          product_quality: createProductDto.product_quality as
            | 'ORIGINAL'
            | 'REACONDICIONADO',
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

      return product;
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException();
    }
  }

  async searchProduct(word: string) {
    try {
      const productsFound = await this.prisma.product.findMany({
        where: {
          name: { contains: word, mode: 'insensitive' },
        },
        include: { category: { select: { category_name: true, id: true } } },
      });
      // ASSIGN THE IMAGES FOR EACH PRODUCT
      for (const product of productsFound) {
        product.imageUrl = (await this.s3.getSignedUrlsFromImages(
          product.images,
        )) as string[];
      }
      return productsFound;
    } catch (error) {
      console.log(error);
      throw new NotFoundException(error);
    }
  }

  async updateProduct(
    id: string,
    updateProductDto: UpdateProductDto,
    files: ProductFiles,
  ) {
    try {
      const images = files['newImages[]'];

      // Fetch the existing product
      const productToUpdate = await this.prisma.product.findFirst({
        where: { id: id },
      });

      if (!productToUpdate) {
        throw new NotFoundException('Product not found');
      }

      // Process and upload each file to S3 if there are new files
      let imagesTransformed: string[] = [];

      if (images?.length > 0) {
        for (const file of images) {
          imagesTransformed.push(await this.s3.createFile(file));
        }
      }

      // Combine existing images with new ones
      const updatedImages =
        imagesTransformed.length > 0
          ? [...productToUpdate.images, ...imagesTransformed]
          : productToUpdate.images;

      // Update the product
      const productUpdated = await this.prisma.product.update({
        where: { id: id },
        data: {
          name: updateProductDto.name,
          category: {
            connect: {
              category_name: updateProductDto.category_name,
            },
          },
          images: updatedImages,
          description: updateProductDto.description,
          price: updateProductDto.price,
          tags: updateProductDto.tags,
          notes: updateProductDto.notes,
          product_quality: updateProductDto.product_quality as
            | 'ORIGINAL'
            | 'REACONDICIONADO',
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

      return productUpdated;
    } catch (err: any) {
      console.log(err);
      throw new InternalServerErrorException({
        message: err.message as string,
        status: 500,
      });
    }
  }

  async removeProduct(id: string) {
    const productToDelete = await this.prisma.product.findFirst({
      where: {
        id: id,
      },
    });

    if (!productToDelete) {
      throw new BadRequestException('No existe el producto');
    }

    // Delete the images from the s3 bucket
    for (const image of productToDelete.images) {
      await this.s3.deleteFile(image);
    }

    try {
      const productDeleted = await this.prisma.product.delete({
        where: {
          id: id,
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

      return productDeleted;
    } catch (err: any) {
      throw new InternalServerErrorException({
        message: err.message as string,
        status: 500,
      });
    }
  }

  async findSingleProduct(id: string) {
    try {
      const product = await this.prisma.product.findFirst({
        where: {
          id: id,
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

      const categories = await this.prisma.category.findMany();

      const imagesUrls = await this.s3.getSignedUrlsFromImages(product.images);
      return {
        ...product,
        imageUrl: imagesUrls,
        categories: categories,
      } as Product;
    } catch (err: any) {
      throw new InternalServerErrorException({
        message: err.message as string,
        status: 500,
      });
    }
  }

  /* 
    CART AND PRODUCTS
  */

  async getHomepageProducts(name: string, limit: number) {
    try {
      const products = await this.prisma.product.findMany({
        where: {
          category: {
            category_name: name,
          },
        },
        include: {
          category: {
            select: {
              category_name: true,
              id: true,
            },
          },
        },
        take: limit,
      });

      if (!products || products.length === 0) {
        throw new Error('No se pudieron encontrar productos');
      }

      for (const product of products) {
        product.imageUrl = (await this.s3.getSignedUrlsFromImages(
          product.images,
        )) as string[];
      }

      return products;
    } catch (err: any) {
      throw new InternalServerErrorException({
        message: err.message,
        status: err.status || 500,
      });
    }
  }

  async getCartImage(id: string): Promise<string[]> {
    const product = await this.prisma.product.findFirst({
      where: {
        id: id,
      },
    });

    try {
      return (await this.s3.getSignedUrlsFromImages(
        product.images,
      )) as string[];
    } catch (err: any) {
      throw new InternalServerErrorException({
        message: err.message as string,
        status: 500,
      });
    }
  }

  async deleteImageFromProduct(id: string, image: string) {
    try {
      const product = await this.prisma.product.findFirst({
        where: {
          id: id,
        },
      });

      if (!product) {
        throw new BadRequestException('Product not found');
      }

      const productImages = product.images;

      const index = productImages.indexOf(image);

      if (index === -1) {
        throw new BadRequestException('Image not found');
      }

      await this.s3.deleteFile(productImages[index]);
      productImages.splice(index, 1);

      await this.prisma.product.update({
        where: { id: id },
        data: {
          images: productImages,
        },
      });
    } catch (err: any) {
      throw new InternalServerErrorException({
        message: err.message as string,
        status: 500,
      });
    }
  }

  async getProductsByLimit(limit: string, id: string) {
    try {
      let products = [];
      if (id) {
        products = await this.prisma.product.findMany({
          where: {
            id: {
              not: id,
            },
          },
          take: parseInt(limit),
        });
      } else {
        products = await this.prisma.product.findMany({
          take: parseInt(limit),
        });
      }

      for (const product of products) {
        product.imageUrl = await this.s3.getSignedUrlsFromImages(
          product.images,
        );
      }

      return products;
    } catch (err: any) {
      throw new InternalServerErrorException({
        message: err.message as string,
        status: 500,
      });
    }
  }
}
