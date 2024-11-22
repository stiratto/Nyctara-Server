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
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
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
    file: Express.Multer.File | string,
  ) {
    try {
      const imagesTransformed: string[] = [];

      // Transform the file into an array of files

      const rawFiles: CustomFile[] | string = file as any;
      let filesArray: CustomFile[];

      if (typeof rawFiles === 'string') {
        // Convert string to array if necessary
        filesArray = rawFiles.split(',').map((fileString) => {
          // Create a dummy CustomFile object or define your logic to convert string to CustomFile object
          return {
            originalname: fileString,
            buffer: Buffer.from(fileString),
          } as CustomFile;
        });
      } else {
        filesArray = rawFiles;
      }

      // Process and upload each file to S3
      for (const file of filesArray) {
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

      // Convert the tags to an array
      const tagsArray =
        typeof createProductDto.tags === 'string'
          ? createProductDto.tags.split(' ')
          : createProductDto.tags;

      // Convert the notes to an array
      const splitNotesString = (str: string): string[] => {
        // Match quoted phrases and individual words
        const regex = /"([^"]*)"|[^,]+/g;
        const matches = [];
        let match;
        while ((match = regex.exec(str)) !== null) {
          matches.push(match[1] || match[0]);
        }
        return matches;
      };

      // Convert the notes to an array
      const notesArray =
        typeof createProductDto.notes === 'string'
          ? splitNotesString(createProductDto.notes)
          : createProductDto.notes;

      // Create the product
      const product = await this.prisma.product.create({
        data: {
          name: createProductDto.name,
          description: createProductDto.description,
          notes: notesArray,
          category: {
            connect: {
              category_name: createProductDto.category_name,
            },
          },
          price: createProductDto.price,
          images: imagesTransformed,
          tags: tagsArray,
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
    const result = await this.prisma.product.findMany({
      where: {
        name: {
          search: word,
        },
      },
    });

    for (const product of result) {
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

    return result;
  }

  async updateProduct(
    id: string,
    updateProductDto: UpdateProductDto,
    images: Express.Multer.File | string,
  ) {
    try {
      // Fetch the existing product
      const productToUpdate = await this.prisma.product.findFirst({
        where: { id: id },
      });

      if (!productToUpdate) {
        throw new BadRequestException('Product not found');
      }

      // Check if the image is already in the product

      // Transform the file(s) into an array of files
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
      if (filesArray.length > 0) {
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

      const tagsArray =
        typeof updateProductDto.tags === 'string'
          ? updateProductDto.tags.split(' ')
          : updateProductDto.tags;

      const splitNotesString = (str: string): string[] => {
        // Match quoted phrases and individual words
        const regex = /"([^"]*)"|[^,]+/g;
        const matches = [];
        let match;
        while ((match = regex.exec(str)) !== null) {
          matches.push(match[1] || match[0]);
        }
        return matches;
      };
      const notesArray =
        typeof updateProductDto.notes === 'string'
          ? splitNotesString(updateProductDto.notes)
          : updateProductDto.notes;

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
          tags: tagsArray,
          notes: notesArray,
          product_quality: updateProductDto.product_quality as
            | 'ORIGINAL'
            | 'REACONDICIONADO',
        },
      });

      return productUpdated;
    } catch (err: any) {
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

  async findAllItemsPrisma() {
    try {
      const products = await this.prisma.product.findMany();
      const imagesUrls: string[] = [];

      for (const product of products) {
        const category = await this.prisma.category.findUnique({
          where: {
            id: product.categoryId,
          },
        });

        for (const image of product.images) {
          // Get the category of the product

          const getObjectParams = {
            Bucket: this.config.get<string>('amazon_s3.bucket_name'),
            Key: image,
          };

          const command = new GetObjectCommand(getObjectParams);
          const url = await getSignedUrl(this.s3, command, { expiresIn: 3600 });

          imagesUrls.push(url);

          product.imageUrl = imagesUrls;

          (product as any).category = category;
        }
      }

      return products;
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
    Categories
  */

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

      // Now you can use the updatedImage for further processing or updating the product in the database
    } catch (err) {
      console.log(err);
    }

    // Combine existing images with new ones
  }

  async createNewCategory(category_name: string, file: Express.Multer.File) {
    const newCategoryName = category_name['category_name'];

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

  async findAllCategories(category: string) {
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

  async findSingleCategory(id: string) {
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

  async findSingleCategoryWithProducts(id: string) {
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

  async getProductsByLimitExcludingOne(limit: string, id: string) {
    try {
      const totalProducts = await this.prisma.product.count({
        where: {
          id: {
            not: id,
          },
        },

        take: parseInt(limit),
      });

      const randomIndices = Array.from({ length: parseInt(limit) }, () =>
        Math.floor(Math.random() * totalProducts),
      );

      const products = await this.prisma.product.findMany({
        where: {
          id: {
            not: id,
          },
        },
        skip: randomIndices[0], // Empieza desde un índice aleatorio
        take: parseInt(limit), // Toma la cantidad de productos especificada
      });

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
      throw new InternalServerErrorException({
        message: err.message as string,
        status: 500,
      });
    }
  }

  async getAllProductsByLimit(limit: string) {
    try {
      const products = await this.prisma.product.findMany({
        take: parseInt(limit),
      });

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

  // DISCOUNTS

  async createDiscount(createDiscountDto: CreateDiscountDto) {
    try {
      const discount = await this.prisma.discount.create({
        data: {
          discount_name: createDiscountDto.discount_name,
          discount_total: createDiscountDto.discount_total,
        },
      });

      return discount;
    } catch (err: any) {
      throw new InternalServerErrorException({
        message: err.message as string,
        status: 500,
      });
    }
  }

  async getSingleDiscount(discount_name: string) {
    try {
      const discount = await this.prisma.discount.findFirst({
        where: {
          discount_name: discount_name,
        },
        select: {
          discount_name: true,
          discount_total: true,
        },
      });

      if (!discount) {
        throw new NotFoundException({
          message: 'No se pudo encontrar el descuento',
          status: 410,
        });
      }

      return discount;
    } catch (err: any) {
      throw new InternalServerErrorException({
        message: err.message,
        status: 500,
      });
    }
  }

  async getAllDiscounts() {
    try {
      const discounts = this.prisma.discount.findMany();
      return discounts;
    } catch (err: any) {
      throw new InternalServerErrorException({
        message: err.message,
        status: 500,
      });
    }
  }

  async deleteDiscount(id: string) {
    try {
      const discount = await this.prisma.discount.delete({
        where: {
          id: id,
        },
      });

      return discount;
    } catch (err: any) {
      throw new InternalServerErrorException({
        message: err.message as string,
        status: 500,
      });
    }
  }
}
