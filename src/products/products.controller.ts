import {
  Controller,
  Get,
  Post,
  Body,
  Patch, Param,
  Delete,
  UseInterceptors, UploadedFiles,
  Logger
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import {
  FilesInterceptor,
  FileFieldsInterceptor
} from '@nestjs/platform-express';
import { Product, ProductFiles } from './interfaces/product.interfaces';

@Controller('api/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // CREATE PRODUCT: /api/products/create-product
  @Post('/create-product')
  @UseInterceptors(FilesInterceptor('images'))
  create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() images: (Express.Multer.File | string)[], // Use @UploadedFiles() for multiple files
  ): Promise<Product> {
    Logger.log('::: Products Controller ::: createProduct()');
    return this.productsService.createItemPrisma(createProductDto, images)
  }

  // /api/products/search/{word: string}
  @Get('search/:word')
  searchProduct(@Param('word') word: string): Promise<Product[]> {
    Logger.log(`::: Products Controller ::: searchProduct() word=${word}`);
    return this.productsService.searchProduct(word);
  }

  // GET PRODUCT BY ID: /api/products/:id
  @Get(':id')
  findSingleProduct(@Param('id') id: string): Promise<Product> {
    Logger.log(`::: Products Controller ::: findProductById() ID=${id}`);
    return this.productsService.findSingleProduct(id);
  }

  // GET CART PRODUCT IMAGE: /api/products/cart/{product: id}
  @Get('cart/:id')
  getCartImage(@Param('id') id: string): Promise<string> {
    Logger.log(
      `::: Products Controller ::: getCartProductImage() - product: ${id}`,
    );
    return this.productsService.getCartImage(id);
  }

  // UPDATE PRODUCT: /api/products/{product: id}
  @Patch(':id')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'existingImages[]' },
      { name: 'newImages[]' },
    ]),
  )
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles()
    files: ProductFiles,
  ): Promise<Product> {
    Logger.log(`::: Products Controller ::: updateProduct() product: ${id}`);
    return this.productsService.updateProduct(id, updateProductDto, files);
  }

  // DELETE PRODUCT: /api/products/{delete: id}
  @Delete(':id')
  remove(@Param('id') id: string): Promise<Product> {
    Logger.log(`::: Products Controller ::: deleteProduct() - id=${id} `);

    return this.productsService.removeProduct(id);
  }

  // /api/products/limit/:limit/:id
  @Get('limit/:limit/:id?')
  getProductsByLimit(@Param('limit') limit: string, @Param('id') id: string): Promise<Product[]> {
    Logger.log('::: Products Controller ::: getProductsByLimit()');
    return this.productsService.getProductsByLimit(limit, id);
  }

  // DELETE IMAGE FROM PRODUCT: /api/products/image/:id/:image
  @Delete('image/:id/:image')
  deleteImageFromProduct(
    @Param('id') id: string,
    @Param('image') image: string,
  ): Promise<void> {
    Logger.log('::: Products Controller ::: deleteImageFromProduct()');
    return this.productsService.deleteImageFromProduct(id, image);
  }

  @Get('/homepage/:name/:limit')
  getHomepageProducts(@Param('name') name: string, limit: number): Promise<Product[]> {
    Logger.log('::: Products Controller ::: getHomepageProducts()');
    return this.productsService.getHomepageProducts(name, limit);
  }

}
