import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
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
    file: Express.Multer.File,
  ) {
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

      // Convert the tags to an array
      const rawTags = createProductDto.tags;

      // Define a new array to store the tags
      let tagsArray: string[];
      // If the type of the tags is a string, split it into an array
      if (typeof rawTags === 'string') {
        /* 
          split() works as the following:
          - If the string is "tag1 tag2 tag3", the result will be an array with 3 elements (each word within the string) (depending on what the separator is, if it's a space, then split(' ), if it's a comma, then split(','), etc.)
        */
        tagsArray = rawTags.split(' ');
      } else {
        // If it's already an array, use it as is
        tagsArray = rawTags;
      }

      // Convert the notes to an array

      let rawNotes = createProductDto.notes;

      let notesArray: string[];

      if (typeof rawNotes === 'string') {
        /* 
          split() works as the following:
          - If the string is "note1 note2 note3", the result will be an array with 3 elements (each word within the string) (depending on what the separator is, if it's a space, then split(' ), if it's a comma, then split(','), etc.)
        */
        notesArray = rawNotes.split(' ');
      } else {
        // If it's already an array, use it as is
        notesArray = rawNotes;
      }

      console.log(createProductDto.category_name);

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
          image: command.input.Key,
          tags: tagsArray,
        },
      });

      console.log(product);
      return product;
    } catch (err) {
      throw new InternalServerErrorException(
        'Hubo un error: ' +
          err.message +
          ' (status: ' +
          (err.statusCode || 'desconocido') +
          ')',
      );
    }
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
    } catch (err) {
      throw new InternalServerErrorException(
        'Hubo un error: ' +
          err.message +
          '(status: ' +
          (err.statusCode || 'desconocido') +
          ')',
      );
    }
  }

  async findAllCategories() {
    try {
      const categories = await this.prisma.category.findMany();
      for (const category of categories) {
        const getObjectParams = {
          Bucket: this.config.get<string>('amazon_s3.bucket_name'),
          Key: category.image,
        };

        const command = new GetObjectCommand(getObjectParams);
        const url = await getSignedUrl(this.s3, command, { expiresIn: 3600 });

        category.imageUrl = url;
      }
      return categories;
    } catch (err) {
      throw new InternalServerErrorException(
        'Hubo un error: ' +
          err.message +
          '(status: ' +
          (err.statusCode || 'desconocido') +
          ')',
      );
    }
  }

  async findAllItemsPrisma() {
    try {
      const products = await this.prisma.product.findMany();

      for (const product of products) {
        // Get the category of the product
        const category = await this.prisma.category.findUnique({
          where: {
            id: product.categoryId,
          },
        });

        const getObjectParams = {
          Bucket: this.config.get<string>('amazon_s3.bucket_name'),
          Key: product.image,
        };

        const command = new GetObjectCommand(getObjectParams);
        const url = await getSignedUrl(this.s3, command, { expiresIn: 3600 });

        product.imageUrl = url;
        (product as any).category = category;
        console.log(url);
      }

      return products;
    } catch (err) {
      new InternalServerErrorException(
        'Hubo un error' + err.message + err.statusCode,
      );
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

      const getObjectParams = {
        Bucket: this.config.get<string>('amazon_s3.bucket_name'),
        Key: product.image,
      };

      const command = new GetObjectCommand(getObjectParams);
      const url = await getSignedUrl(this.s3, command, { expiresIn: 3600 });

      product.imageUrl = url;

      return product;
    } catch (err) {
      throw new InternalServerErrorException(
        'Hubo un error: ' +
          err.message +
          '(status: ' +
          (err.statusCode || 'desconocido') +
          ')',
      );
    }
  }

  async getCartImage(id: string): Promise<string> {
    const product = await this.prisma.product.findFirst({
      where: {
        id: id,
      },
    });

    try {
      const getObjectParams = {
        Bucket: this.config.get<string>('amazon_s3.bucket_name'),
        Key: product.image,
      };

      const command = new GetObjectCommand(getObjectParams);
      const url = await getSignedUrl(this.s3, command, { expiresIn: 3600 });
      return url;
    } catch (err) {
      throw new InternalServerErrorException(
        'Hubo un error: ' +
          err.message +
          '(status: ' +
          (err.statusCode || 'desconocido') +
          ')',
      );
    }
  }

  async findSingleCategory(id: string) {
    try {
      const category = await this.prisma.category.findFirst({
        where: {
          id: id,
        },
      });

      const params = {
        Bucket: this.config.get<string>('amazon_s3.bucket_name'),
        Key: category.image,
      };

      const command = new GetObjectCommand(params);

      try {
        const products = await this.prisma.product.findMany({
          where: {
            categoryId: category.id,
          },
        });

        for (const product of products) {
          const getObjectParams = {
            Bucket: this.config.get<string>('amazon_s3.bucket_name'),
            Key: product.image,
          };

          const command = new GetObjectCommand(getObjectParams);
          const url = await getSignedUrl(this.s3, command, { expiresIn: 3600 });

          product.imageUrl = url;
        }
        return products;
      } catch (err) {
        throw new InternalServerErrorException(
          'Hubo un error: ' +
            err.message +
            '(status: ' +
            (err.statusCode || 'desconocido') +
            ')',
        );
      }
    } catch (err) {
      throw new InternalServerErrorException(
        'Hubo un error: ' +
          err.message +
          '(status: ' +
          (err.statusCode || 'desconocido') +
          ')',
      );
    }
  }

  async updateProduct(
    id: string,
    updateProductDto: UpdateProductDto,
    image: Express.Multer.File,
  ) {
    if (typeof image.originalname === null) {
      return 'No se ha enviado el archivo';
    }

    const fileExtName = extname(image.originalname);

    const randomname = `${uuidv4()}${fileExtName}`;

    const params = {
      Bucket: this.config.get<string>('amazon_s3.bucket_name'),
      Key: randomname,
      Body: image.buffer,
      ContentType: image.mimetype,
    };

    const command = new PutObjectCommand(params);

    try {
      await this.s3.send(command);

      const productToUpdate = await this.prisma.product.findFirst({
        where: {
          id: id,
        },
      });

      if (!productToUpdate) {
        throw new BadRequestException('No existe el producto');
      }

      const rawNotes = updateProductDto.notes;

      let notesArray: string[];

      if (typeof rawNotes === 'string') {
        /* 
          split() works as the following:
          - If the string is "note1 note2 note3", the result will be an array with 3 elements (each word within the string) (depending on what the separator is, if it's a space, then split(' ), if it's a comma, then split(','), etc.)
        */
        notesArray = rawNotes.split(' ');
      } else {
        // If it's already an array, use it as is
        notesArray = rawNotes;
      }

      const rawTags = updateProductDto.tags;

      let tagsArray: string[];

      if (typeof rawTags === 'string') {
        /* 
          split() works as the following:
          - If the string is "tag1 tag2 tag3", the result will be an array with 3 elements (each word within the string) (depending on what the separator is, if it's a space, then split(' ), if it's a comma, then split(','), etc.)
        */
        tagsArray = rawTags.split(' ');
      } else {
        // If it's already an array, use it as is
        tagsArray = rawTags;
      }

      const productUpdated = await this.prisma.product.update({
        where: {
          id: id,
        },
        data: {
          name: updateProductDto.name,
          category: {
            connect: {
              category_name: updateProductDto.category.category_name,
            },
          },
          image: command.input.Key,
          description: updateProductDto.description,
          price: updateProductDto.price,
          tags: notesArray,
          notes: tagsArray,
        },
      });

      return productUpdated;
    } catch (err) {
      throw new InternalServerErrorException(
        'Hubo un error: ' +
          err.message +
          ' (status: ' +
          (err.statusCode || 'desconocido') +
          ')',
      );
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
    } catch (err) {
      throw new InternalServerErrorException(
        'Hubo un error: ' +
          err.message +
          '(status: ' +
          (err.statusCode || 'desconocido') +
          ')',
      );
    }
  }

  async getProductsByLimit(limit: string, file: Express.Multer.File) {
    try {
      const products = await this.prisma.product.findMany({
        take: parseInt(limit),
      });

      for (const product of products) {
        const getObjectParams = {
          Bucket: this.config.get<string>('amazon_s3.bucket_name'),
          Key: product.image,
        };

        const command = new GetObjectCommand(getObjectParams);
        const url = await getSignedUrl(this.s3, command, { expiresIn: 3600 });

        product.imageUrl = url;
      }

      return products;
    } catch (err) {
      throw new InternalServerErrorException(
        'Hubo un error: ' +
          err.message +
          '(status: ' +
          (err.statusCode || 'desconocido') +
          ')',
      );
    }
  }
}
