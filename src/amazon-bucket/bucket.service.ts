import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { forwardRef, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CategoriesService } from 'src/categories/categories.service';
import sharp from 'sharp';

@Injectable()
export class BucketService {
  private s3: S3Client;
  constructor(
    private config: ConfigService,
    // For circular dependencies
    @Inject(forwardRef(() => CategoriesService)) private categoriesService: CategoriesService
  ) {
    this.s3 = new S3Client({
      region: this.config.get<string>('amazon_s3.bucket_region'),
      credentials: {
        accessKeyId: this.config.get<string>('amazon_s3.access_key'),
        secretAccessKey: this.config.get<string>('amazon_s3.secret_access_key'),
      },

    });
  }

  async getSignedUrlsFromImages(folder: string, images: string[] | string): Promise<string[] | string> {
    try {
      const bucketName = this.config.get<string>('amazon_s3.bucket_name');
      console.log(this.config.get<string>('amazon_s3.secret_access_key'))
      if (Array.isArray(images)) {
        return Promise.all(
          images.map(async (image) =>
            getSignedUrl(
              this.s3,
              new GetObjectCommand({ Bucket: bucketName, Key: `${folder}/${image}` }),
              { expiresIn: 3600 },
            ),
          ),
        );
      } else {
        return getSignedUrl(
          this.s3,
          new GetObjectCommand({ Bucket: bucketName, Key: `${folder}/${images}` }),
          { expiresIn: 3600 },
        );
      }
    } catch (error) {
      console.log(error);
    }
  }

  async createFile(folder: string, file: Express.Multer.File | string): Promise<string> {
    try {

      file = file as Express.Multer.File;
      const img = await sharp(file.buffer).webp({ quality: 60 }).toBuffer()
      const bucketName = this.config.get<string>('amazon_s3.bucket_name');
      const randomname = `${uuidv4()}.webp`;
      const params = {
        Bucket: bucketName,
        Key: `${folder}/${randomname}`,
        Body: img,

      };
      const command = new PutObjectCommand(params);
      await this.s3.send(command);
      return randomname;
    } catch (error: any) {
      console.error('Error when uploading file to s3', error);
      throw new InternalServerErrorException(error);
    }
  }

  async deleteFile(file: Express.Multer.File | string) {
    try {
      const bucketName = this.config.get<string>('amazon_s3.bucket_name');
      const fileKey = this.categoriesService.isMulterFile(file) ? file.filename : file
      const params = {
        Bucket: bucketName,
        Key: fileKey,
      };

      const deleteCommand = new DeleteObjectCommand(params);
      await this.s3.send(deleteCommand);
    } catch (error) {
      console.error('Error when trying to delete a file from s3: ', error);
      throw new InternalServerErrorException(error);
    }
  }
}
