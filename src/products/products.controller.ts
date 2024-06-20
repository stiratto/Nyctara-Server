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
  UploadedFiles,
  Logger,
  UsePipes,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('api/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /*
   CATEGORIES
  */

  // CREATE NEW CATEGORY: /api/products/categories/create-category

  @Post('/create-category')
  @UseInterceptors(FileInterceptor('image'))
  createNewCategory(
    @Body() category_name: string,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return this.productsService.createNewCategory(category_name, image);
  }
  a;

  // FIND ALL CATEGORIES: /api/products/categories
  @Get('/categories/:category?')
  findAllCategories(@Param('category') category: string) {
    return this.productsService.findAllCategories(category);
  }
  @Get('/categories/find-category/:id')
  findSingleCategory(@Param('id') id: string) {
    return this.productsService.findSingleCategory(id);
  }

  @Patch('categories/:id')
  @UseInterceptors(FileInterceptor('image'))
  updateCategory(
    @Body('category_name') category_name: string,
    @Param('id') id: string,
    @UploadedFile() image: Express.Multer.File | string, // Use @UploadedFiles() for multiple files
  ) {
    console.log(id);
    console.log(category_name);
    console.log(image);
    return this.productsService.updateCategory(id, image, category_name);
  }

  @Get('search/:word')
  searchProduct(@Param('word') word: string) {
    return this.productsService.searchProduct(word);
  }

  // FIND SINGLE CATEGORY WITH PRODUCTS: /api/products/category/:id
  @Get('category/:id')
  findOneCategoryWithProducts(@Param('id') id: string) {
    return this.productsService.findSingleCategoryWithProducts(id);
  }

  @Get('category/:id')
  findSingleCategoryWithProducts(@Param('id') id: string) {
    return this.productsService.findSingleCategoryWithProducts(id);
  }

  @Delete('category/:id')
  deleteCategory(@Param('id') id: string) {
    return this.productsService.deleteCategory(id);
  }

  /* 
    PRODUCTS 
  */

  // CREATE PRODUCT: /api/products/create-post
  @Post('/create-post')
  @UseInterceptors(FilesInterceptor('images'))
  create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() images: Express.Multer.File | string, // Use @UploadedFiles() for multiple files
  ) {
    return this.productsService.createItemPrisma(createProductDto, images);
  }

  // FIND SINGLE PRODUCT: /api/products/:id
  @Get(':id')
  findSingleProduct(@Param('id') id: string) {
    return this.productsService.findSingleProduct(id);
  }

  // GET CART PRODUCT IMAGE: /api/products/cart/:id
  @Get('cart/:id')
  getCartImage(@Param('id') id: string) {
    return this.productsService.getCartImage(id);
  }

  // UPDATE PRODUCT: /api/products/:id
  @Patch(':id')
  @UseInterceptors(FilesInterceptor('images'))
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles() images: Express.Multer.File | string,
  ) {
    return this.productsService.updateProduct(id, updateProductDto, images);
  }

  // DELETE PRODUCT: /api/products/:id
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.removeProduct(id);
  }

  // GET PRODUCTS BY LIMIT: /api/products/limit/:limit/:id
  @Get('limit/:limit/:id')
  getProductsByLimitExcludingOne(
    @Param('limit') limit: string,
    @Param('id') id: string,
  ) {
    return this.productsService.getProductsByLimitExcludingOne(limit, id);
  }
  @Get('limit/:limit')
  getProductsByLimit(@Param('limit') limit: string) {
    return this.productsService.getAllProductsByLimit(limit);
  }

  // DELETE IMAGE FROM PRODUCT: /api/products/image/:id/:image
  @Delete('image/:id/:image')
  deleteImageFromProduct(
    @Param('id') id: string,
    @Param('image') image: string,
  ) {
    return this.productsService.deleteImageFromProduct(id, image);
  }

  @Get('discounts/getDiscount/:discount_name')
  getSingleDiscount(@Param('discount_name') discount_name: string) {
    return this.productsService.getSingleDiscount(discount_name);
  }

  @Get('discounts/all')
  getAllDiscounts() {
    return this.productsService.getAllDiscounts();
  }

  @Post('discounts/create-discount')
  createDiscount(@Body() createDiscountDto: CreateDiscountDto) {
    console.log(createDiscountDto);
    return this.productsService.createDiscount(createDiscountDto);
  }

  @Get('/homepage/:name/:limit')
  getHomepageProducts(@Param('name') name: string, limit: number) {
    return this.productsService.getHomepageProducts(name, limit);
  }

  @Delete('discounts/:id')
  deleteDiscount(@Param('id') id: string) {
    return this.productsService.deleteDiscount(id);
  }

  // PROMOTIONS
}
