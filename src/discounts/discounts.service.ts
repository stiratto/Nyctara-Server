import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class DiscountsService {
  constructor(private prisma: DatabaseService) { }
  async createDiscount(createDiscountDto: CreateDiscountDto) {
    try {
      const discountExists = await this.prisma.discount.findFirst(
        {
          where:
            { discount_name: createDiscountDto.discount_name }
        }
      )
      if (discountExists) {
        throw new InternalServerErrorException("Discount already exists")
      }
      const discount = await this.prisma.discount.create({
        data: {
          discount_name: createDiscountDto.discount_name,
          discount_total: createDiscountDto.discount_total,
          valid_until: createDiscountDto.valid_until
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
      });

      if (!discount) {
        console.log("Discount not found")
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
      const discounts = await this.prisma.discount.findMany();
      console.log(discounts)
      return discounts;
    } catch (err: any) {
      console.log(err)
      throw new InternalServerErrorException({
        message: err.message,
        status: 500,
      });
    }
  }

  async deleteDiscount(id: string) {
    try {
      const discountExists = await this.prisma.discount.findUnique({
        where: {
          id: id,
        },
      });

      if (!discountExists) {
        throw new NotFoundException('Discount not found');
      }
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
