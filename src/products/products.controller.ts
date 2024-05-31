import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('api/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /*
   CATEGORIES
  */
  @Post('/create-category')
  @UseInterceptors(FileInterceptor('image'))
  createNewCategory(
    @Body() category_name: string,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return this.productsService.createNewCategory(category_name, image);
  }

  @Get('/categories')
  findAllCategories() {
    return this.productsService.findAllCategories();
  }

  /* 
    PRODUCTS 
  */
  @Post('/create-post')
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return this.productsService.createItemPrisma(createProductDto, image);
  }

  @Get(':id')
  findOneProduct(@Param('id') id: string) {
    return this.productsService.findSingleProduct(id);
  }
  @Get('category/:id')
  findOneCategory(@Param('id') id: string) {
    return this.productsService.findSingleCategory(id);
  }

  @Get('cart/:id')
  getCartImage(@Param('id') id: string) {
    return this.productsService.getCartImage(id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return this.productsService.updateProduct(id, updateProductDto, image);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.removeProduct(id);
  }

  @Get('limit/:limit')
  @UseInterceptors(FileInterceptor('image'))
  getProductsByLimit(
    @Param('limit') limit: string,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return this.productsService.getProductsByLimit(limit, image);
  }
}
