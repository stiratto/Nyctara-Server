import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { PrismaService } from '../products/prisma.service';

@Injectable()
export class DiscountsService {
  constructor(private prisma: PrismaService) {}
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
