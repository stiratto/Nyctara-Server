import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product, ProductFiles } from './interfaces/product.interfaces';
import { DatabaseService } from '../database/database.service';
import { BucketService } from 'src/amazon-bucket/bucket.service';
import { ProductsController } from './products.controller';

@Injectable()
export class ProductsService {
  /*    This lets us use the prisma functions in this service */
  constructor(
    private prisma: DatabaseService,
    private s3: BucketService,
  ) { }
  // Define the S3 client that will be used to interact with the S3 bucket

  private readonly logger = new Logger("ProductsService")

  async createProduct(
    createProductDto: CreateProductDto,
    files: (Express.Multer.File | string)[],
  ) {
    try {

      const imagesTransformed: string[] = await Promise.all(files.map((file) => this.s3.createFile('products', file)))


      // Create the product
      const product = await this.prisma.product.create({
        data: {
          product_name: createProductDto.product_name,
          product_description: createProductDto.product_description,
          product_notes: createProductDto.product_notes,
          product_category: {
            connect: {
              category_name: createProductDto.product_category.category_name,
            },
          },
          product_price: createProductDto.product_price,
          product_images: imagesTransformed,
          product_tags: createProductDto.product_tags,
          product_quality: createProductDto.product_quality as
            | 'ORIGINAL'
            | 'REACONDICIONADO',
          isAvailable: true
        },
        include: {
          product_category: {
            select: {
              category_name: true,
              id: true,
            },
          },
        },
      });

      if (!product) {
        this.logger.error("No se pudo crear un producto")
        throw new InternalServerErrorException("No se pudo crear el producto")
      }

      return product;
    } catch (err) {
      this.logger.error("Ocurrio un error inesperado")
      throw new InternalServerErrorException("Ocurrio un error inesperado", err);
    }
  }

  async searchProduct(word: string) {
    try {
      let productsToReturn: Product[] = [];
      const productsFound = await this.prisma.product.findMany({
        where: {
          product_name: { contains: word, mode: 'insensitive' },
        },
        include: { product_category: { select: { category_name: true, id: true } } },
      });
      // ASSIGN THE IMAGES FOR EACH PRODUCT
      for (const product of productsFound) {
        let productToReturn = product
        productToReturn.product_images = await this.s3.getSignedUrlsFromImages('products',
          product.product_images,
        ) as string[];

        productsToReturn?.push(productToReturn)
      }

      return productsToReturn
    } catch (error) {
      this.logger.error("Hubo un error al buscar productos por una palabra")
      throw new InternalServerErrorException(error);
    }
  }

  async deleteBulkProducts(payload: { products: string[] }) {
    const { products } = payload
    try {
      if (products.length === 0) {
        throw new BadRequestException("No se encontraron productos para eliminar")
      }

      const response = await this.prisma.product.updateMany({
        where: {
          id: {
            in: products
          }
        },
        data: {
          isAvailable: false
        }
      })

      return response
    } catch (err) {
      console.log(err)
      throw new InternalServerErrorException(err)
    }
  }

  async updateProduct(
    id: string,
    updateProductDto: UpdateProductDto,
    files: ProductFiles,
  ) {
    try {
      const newImages = files['newImages[]'];
      const existingImages = files['existingImages[]'];

      // Fetch the existing product
      const productToUpdate = await this.prisma.product.findFirst({
        where: { id: id },
      });

      if (!productToUpdate) {
        throw new NotFoundException('Product not found');
      }

      // Process and upload each file to S3 if there are new files
      let imagesTransformed;
      if (newImages && newImages?.length > 0) {
        imagesTransformed = await Promise.all(newImages?.map((file) => this.s3.createFile('products', file)));
      }

      // Combine existing images with new ones
      const updatedImages =
        imagesTransformed?.length > 0
          ? [...productToUpdate.product_images, ...imagesTransformed]
          : existingImages;

      // Update the product
      const productUpdated = await this.prisma.product.update({
        where: { id: id },
        data: {
          product_name: updateProductDto.product_name,
          product_category: {
            connect: {
              category_name: updateProductDto.product_category.category_name,
            },
          },
          product_images: updatedImages,
          product_description: updateProductDto.product_description,
          product_price: updateProductDto.product_price,
          product_tags: updateProductDto.product_tags,
          product_notes: updateProductDto.product_notes,
          product_quality: updateProductDto.product_quality as
            | 'ORIGINAL'
            | 'REACONDICIONADO',
        },
        include: {
          product_category: true
        },
      });

      return productUpdated;
    } catch (err: any) {
      console.log(err)
      this.logger.error("Hubo un error al tratar de actualizar un producto", err)
      throw new InternalServerErrorException({
        message: err.message as string,
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
    for (const image of productToDelete.product_images) {
      await this.s3.deleteFile(image);
    }

    try {
      const productDeleted = await this.prisma.product.update({
        where: {
          id: id,
        },
        data: {
          isAvailable: false
        },
        include: {
          product_category: {
            select: {
              category_name: true,
              id: true,
            },
          },
        },
      });

      return productDeleted;
    } catch (err: any) {
      this.logger.error("Hubo un error al eliminar un producto", err)
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
          product_category: {
            select: {
              category_name: true,
              id: true,
            },
          },
        },
      });

      const categories = await this.prisma.category.findMany();

      const imagesUrls = await this.s3.getSignedUrlsFromImages('products', product.product_images);
      product.product_images = imagesUrls as string[]
      return product

    } catch (err: any) {
      throw new InternalServerErrorException({
        message: err.message as string,
        status: 500,
      });
    }
  }

  async getCartProducts(ids: any) {
    try {
      console.log(ids.ids)
      const parsedIds = ids.ids.split(",")

      const products = await this.prisma.product.findMany({
        where: {
          id: {
            in: parsedIds
          }
        }
      })

      for (let product of products) {
        product.product_images = await this.s3.getSignedUrlsFromImages('products', product.product_images) as string[]
      }


      return products
    } catch (error: any) {
      console.log(error)
    }

  }

  async filterProductsByPrice(filters: Record<
    "price" | "availability" | "notes", string | string[] | boolean>) {
    let { price, notes, availability } = filters
    let where: any = {
      AND: []
    }

    if (price) {
      let priceSplit = (price as string).split(",");
      let min = parseInt(priceSplit[0]);
      let max = parseInt(priceSplit[1]);

      if (!isNaN(min) && !isNaN(max)) {
        where.AND.push({ product_price: { gte: min, lte: max } })
      }
    }

    if (availability !== undefined) {
      where.AND.push({ isAvailable: availability })
    }

    if (notes && Array.isArray(notes)) {
      where.AND.push({ product_notes: { hasSome: notes } });
    }


    const results = await this.prisma.product.findMany({ where })


    for (let product of results) {
      product.product_images = await this.s3.getSignedUrlsFromImages('products', product.product_images) as string[]
    }

    console.log(results)
    return results

  }

  async getAllProducts() {
    try {
      const products = await this.prisma.product.findMany({
        include: {
          product_category: true
        }
      })
      return products
    } catch (err) {
      console.log(err)
      throw new NotFoundException()
    }
  }

  async getHomepageProducts(name: string, limit: number) {
    try {
      const products = await this.prisma.product.findMany({
        where: {
          product_category: {
            category_name: name,
          },
        },
        include: {
          product_category: true,
        },
        take: limit,
      });

      if (!products || products.length === 0) {
        throw new NotFoundException('No se pudieron encontrar productos');
      }

      for (const product of products) {
        product.product_images = (await this.s3.getSignedUrlsFromImages('products',
          product.product_images,
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
      const images = await this.s3.getSignedUrlsFromImages('products', product.product_images) as string[]
      return images
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

      const productImages = product.product_images;

      const index = productImages.indexOf(image);

      if (index === -1) {
        throw new BadRequestException('Image not found');
      }

      await this.s3.deleteFile(productImages[index]);
      productImages.splice(index, 1);

      await this.prisma.product.update({
        where: { id: id },
        data: {
          product_images: productImages,
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
      let productsToReturn = []
      if (id) {
        products = await this.prisma.product.findMany({
          where: {
            id: {
              not: id,
            },
          },
          include: {
            product_category: true
          },
          take: parseInt(limit),
        });
      } else {
        products = await this.prisma.product.findMany({
          take: parseInt(limit),
        });
      }

      for (const product of products) {
        let productToReturn: Product = product
        productToReturn.product_images = await this.s3.getSignedUrlsFromImages('products',
          product.product_images,
        ) as string[]
        productsToReturn.push(productToReturn)
      }

      return productsToReturn;
    } catch (err: any) {
      throw new InternalServerErrorException({
        message: err.message as string,
        status: 500,
      });
    }
  }
}
