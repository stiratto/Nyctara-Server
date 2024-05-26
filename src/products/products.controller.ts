import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseInterceptors,
  UploadedFile,
  Res,
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

  @Get()
  findAll() {
    return this.productsService.findAllItemsPrisma();
  }

  @Get(':id')
  findOneProduct(@Param('id') id: string, createProductDto: CreateProductDto) {
    return this.productsService.findSingleProduct(id, createProductDto);
  }
  @Get('category/:id')
  findOneCategory(@Param('id') id: string) {
    return this.productsService.findSingleCategory(id);
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
