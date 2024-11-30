import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto, CustomFile } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from 'src/products/prisma.service';
import {
  GetObjectCommand,
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ProductsService {
  /* This lets us use the prisma functions in this service */
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  // Define the S3 client that will be used to interact with the S3 bucket
  private s3 = new S3Client({
    region: this.config.get<string>('amazon_s3.bucket_region'),
    credentials: {
      accessKeyId: this.config.get<string>('amazon_s3.access_key'),
      secretAccessKey: this.config.get<string>('amazon_s3.secret_access_key'),
    },
  });

  /* 
    - Create a product in the DB:

  
    - Find all products in the DB
    - Find a product by id
    - Update a product by id
    - Remove a product by id


    NOTE: EVERY PRISMA FUNCTION MUST BE ASYNC
  */

  async createItemPrisma(
    createProductDto: CreateProductDto,
    files: Express.Multer.File | string,
  ) {
    try {
      const imagesTransformed: string[] = [];

      // Process and upload each file to S3
      for (const file of files) {
        const fileExtName = extname(file.originalname);
        const randomname = `${uuidv4()}${fileExtName}`;

        const params = {
          Bucket: this.config.get<string>('amazon_s3.bucket_name'),
          Key: randomname,
          Body: file.buffer,
        };

        const command = new PutObjectCommand(params);

        await this.s3.send(command);

        imagesTransformed.push(command.input.Key);
      }

      // Convert the notes to an array

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
        where: { name: { search: word } },
        include: { category: true },
      });
      console.log(productsFound);

      // ASSIGN THE IMAGES FOR EACH PRODUCT

      for (const product of productsFound) {
        const imagesUrls: string[] = [];
        // GEt the category of the product
        for (const image of product.images) {
          const getObjectParams = {
            Bucket: this.config.get<string>('amazon_s3.bucket_name'),
            Key: image,
          };

          const command = new GetObjectCommand(getObjectParams);
          const url = await getSignedUrl(this.s3, command, { expiresIn: 3600 });

          imagesUrls.push(url);
        }

        product.imageUrl = imagesUrls;
      }

      // GET THE CATEGORY OF THE PRODUCT USING THE CATEGORYID

      console.log(productsFound);

      return productsFound;
    } catch (error) {
      console.log(error);
      throw new NotFoundException(error);
    }
  }

  async updateProduct(
    id: string,
    updateProductDto: UpdateProductDto,
    files: Express.Multer.File | string,
  ) {
    try {
      const images = files['newImages[]'];

      // Fetch the existing product
      const productToUpdate = await this.prisma.product.findFirst({
        where: { id: id },
      });

      if (!productToUpdate) {
        throw new BadRequestException('Product not found');
      }

      const rawFiles: CustomFile[] | string = images as any;

      const filesArray: CustomFile[] = Array.isArray(rawFiles)
        ? rawFiles
        : typeof rawFiles === 'string'
          ? rawFiles.split(',').map(
              (fileString) =>
                ({
                  originalname: fileString,
                  buffer: Buffer.from(fileString),
                }) as CustomFile,
            )
          : [];

      // Process and upload each file to S3 if there are new files
      let imagesTransformed: string[] = [];
      if (images?.length > 0) {
        imagesTransformed = await Promise.all(
          filesArray.map(async (file) => {
            const fileExtName = extname(file.originalname);
            const randomname = `${uuidv4()}${fileExtName}`;
            const params = {
              Bucket: this.config.get<string>('amazon_s3.bucket_name'),
              Key: randomname,
              Body: file.buffer,
            };
            const command = new PutObjectCommand(params);
            await this.s3.send(command);
            return command.input.Key;
          }),
        );
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

    try {
      const productDeleted = await this.prisma.product.delete({
        where: {
          id: id,
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

      const imagesUrls: string[] = [];

      for (const image of product.images) {
        const getObjectParams = {
          Bucket: this.config.get<string>('amazon_s3.bucket_name'),
          Key: image,
        };

        const command = new GetObjectCommand(getObjectParams);
        const url = await getSignedUrl(this.s3, command, { expiresIn: 3600 });

        imagesUrls.push(url);
      }
      product.imageUrl = imagesUrls;
      return product;
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
        take: limit,
      });

      if (!products || products.length === 0) {
        throw new Error('No se pudieron encontrar productos');
      }

      for (const product of products) {
        const imagesUrls: string[] = [];

        for (const image of product.images) {
          const getObjectParams = {
            Bucket: this.config.get<string>('amazon_s3.bucket_name'),
            Key: image,
          };

          const command = new GetObjectCommand(getObjectParams);
          const url = await getSignedUrl(this.s3, command, { expiresIn: 3600 });
          imagesUrls.push(url);
        }

        // Assign the array of URLs to the product's imageUrl property
        product.imageUrl = imagesUrls;
      }

      return products;
    } catch (err: any) {
      throw new InternalServerErrorException({
        message: err.message,
        status: err.status || 500,
      });
    }
  }

  async getCartImage(id: string): Promise<string> {
    const product = await this.prisma.product.findFirst({
      where: {
        id: id,
      },
    });

    // Just because this function only would take a single image to show in the cart
    // I just will take the first image of the product

    try {
      const getObjectParams = {
        Bucket: this.config.get<string>('amazon_s3.bucket_name'),
        Key: product.images[0],
      };

      const command = new GetObjectCommand(getObjectParams);
      const url = await getSignedUrl(this.s3, command, { expiresIn: 3600 });

      return url;
    } catch (err: any) {
      throw new InternalServerErrorException({
        message: err.message as string,
        status: 500,
      });
    }
  }

  async deleteImageFromProduct(id: string, image: string) {
    try {
      console.log(image);

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
        const products = await this.prisma.product.findMany({
          where: {
            id: {
              not: id,
            },
          },
          take: parseInt(limit),
        });
      } else {
        const products = await this.prisma.product.findMany({
          take: parseInt(limit),
        });
      }

      for (const product of products) {
        const imagesUrls: string[] = [];
        for (const image of product.images) {
          const getObjectParams = {
            Bucket: this.config.get<string>('amazon_s3.bucket_name'),
            Key: image,
          };

          const command = new GetObjectCommand(getObjectParams);
          const url = await getSignedUrl(this.s3, command, { expiresIn: 3600 });

          imagesUrls.push(url);
        }
        product.imageUrl = imagesUrls;
      }

      return products;
    } catch (err: any) {
      console.log(err);
      throw new InternalServerErrorException({
        message: err.message as string,
        status: 500,
      });
    }
  }
}
