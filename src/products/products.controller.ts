import {
  Controller,
  Get,
  Post,
  UseGuards,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFiles,
  Logger,
  Query,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import {
  FilesInterceptor,
  FileFieldsInterceptor,
} from '@nestjs/platform-express';
import { Product, ProductFiles } from './interfaces/product.interfaces';
import { AuthGuard } from 'src/auth/auth.guard';
import { Category } from '@prisma/client';

@Controller('api/products')
export class ProductsController {
  constructor(

    private readonly productsService: ProductsService
  ) { }
  private readonly logger = new Logger(ProductsService.name)

  // CREATE PRODUCT: /api/products/create-product

  @UseGuards(AuthGuard)
  @Post('/create-product')
  @UseInterceptors(FilesInterceptor('product_images'))
  createProduct(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() images: (Express.Multer.File | string)[],
  ): Promise<Product> {
    this.logger.log("createProduct()")
    return this.productsService.createProduct(createProductDto, images);
  }

  @Get("/cartProducts/:ids")
  getCartProducts(@Param() ids: string) {
    this.logger.log("getCartProducts()")
    return this.productsService.getCartProducts(ids)
  }


  @Get('/')
  getAllProducts() {
    this.logger.log("getAllProducts()")
    return this.productsService.getAllProducts()
  }

  @Get('/filter-products/:categoryid')
  filterProducts(
    @Param("categoryid") categoryId: string,
    @Query("price") price?: string,
    @Query("availability") availability?: boolean,
    @Query("notes") notes?: string,
  ) {
    this.logger.log("filterProducts()")
    const filters = {
      price,
      availability,
      notes,
    }
    return this.productsService.filterProducts(filters, categoryId)
  }

  // /api/products/search/{word: string}
  @Get('search/:word')
  searchProduct(@Param('word') word: string): Promise<Product[]> {
    this.logger.log(`searchProduct() ${word}`)
    return this.productsService.searchProduct(word);
  }

  @Get('get-all-notes')
  getAllNotes() {
    this.logger.log("getAllNotes()")
    return this.productsService.getAllNotes()
  }

  // GET PRODUCT BY ID: /api/products/:id
  @Get(':id')
  findSingleProduct(@Param('id') id: string): Promise<Product> {
    this.logger.log(`findProductById() ${id}`)
    return this.productsService.findSingleProduct(id);
  }

  // GET CART PRODUCT IMAGE: /api/products/cart/{product: id}
  @Get('cart/:id')
  getCartImage(@Param('id') id: string): Promise<string[]> {

    this.logger.log(`getCartProductImage() ${id}`)
    return this.productsService.getCartImage(id);
  }

  // UPDATE PRODUCT: /api/products/{product: id}
  @UseGuards(AuthGuard)
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
    this.logger.log(`updateProduct() ${id}`)
    return this.productsService.updateProduct(id, updateProductDto, files);
  }

  // DELETE PRODUCT: /api/products/{delete: id}
  @UseGuards(AuthGuard)
  @Delete('deleteProduct/:id')
  remove(@Param('id') id: string): Promise<Product> {

    this.logger.log(`deleteProduct() ${id}`)
    return this.productsService.removeProduct(id);
  }



  // /api/products/limit/:limit/:id
  @Get('limit/:limit/:id?')
  getProductsByLimit(
    @Param('limit') limit: string,
    @Param('id') id: string,
  ): Promise<Product[]> {
    this.logger.log(`getProductsByLimit() ${limit} ${id}`)
    return this.productsService.getProductsByLimit(limit, id);
  }

  // DELETE IMAGE FROM PRODUCT: /api/products/image/:id/:image
  @UseGuards(AuthGuard)
  @Delete('image/:id/:image')
  deleteImageFromProduct(
    @Param('id') id: string,
    @Param('image') image: string,
  ): Promise<void> {
    Logger.log('::: Products Controller ::: deleteImageFromProduct()');
    this.logger.log(`deleteImageFromProduct() ${id}`)
    return this.productsService.deleteImageFromProduct(id, image);
  }

  @UseGuards(AuthGuard)
  @Delete('/deleteBulkProducts')
  deleteBulkProducts(@Body() products: any) {
    this.logger.log(`deleteBulkProducts()`)
    return this.productsService.deleteBulkProducts(products)
  }

  @Get('/homepage/:name/:limit')
  getHomepageProducts(
    @Param('name') name: string,
    limit: number,
  ): Promise<Product[]> {
    this.logger.log(`getHomepageProducts()`)
    return this.productsService.getHomepageProducts(name, limit);
  }
}
