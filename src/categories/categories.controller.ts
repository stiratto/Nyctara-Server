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

import { CategoriesService } from './categories.service';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';

@Controller('api/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // CREATE NEW CATEGORY: /api/categories/create-category
  @Post('/create-category')
  @UseInterceptors(FileInterceptor('image'))
  createNewCategory(
    @Body() category_name: string,
    @UploadedFile() image: Express.Multer.File,
  ) {
    Logger.log('::: Category Controller ::: createNewCategory()');
    return this.categoriesService.createNewCategory(category_name, image);
  }

  // /api/categories/
  @Get()
  getAllCategories() {
    Logger.log('::: Category Controller ::: getAllCategories()');

    return this.categoriesService.getAllCategories();
  }
  // /api/categories/{category: id}
  @Get(':category?')
  getAllCategoriesExcludingOne(@Param('category') category: string) {
    Logger.log('::: Category Controller ::: getAllCategoriesExcludingOne()');
    return this.categoriesService.getAllCategoriesExcludingOne(category);
  }

  // /api/categories/findCategory/{category: id}
  @Get('find-category/:id')
  findCategoryById(@Param('id') id: string) {
    Logger.log('::: Category Controller ::: findCategoryById()');
    return this.categoriesService.findCategoryById(id);
  }

  // /api/categories/updateCategory/{category: id}
  @Patch('update-category/:id')
  @UseInterceptors(FileInterceptor('image'))
  updateCategory(
    @Body('category_name') category_name: string,
    @Param('id') id: string,
    @UploadedFile() image: Express.Multer.File | string, // Use @UploadedFiles() for multiple files
  ) {
    Logger.log('::: Category Controller ::: updateCategory()');
    return this.categoriesService.updateCategory(id, image, category_name);
  }

  // FIND SINGLE CATEGORY WITH PRODUCTS:
  // /api/categories/findCategoryWithProducts/:id
  @Get('find-category-with-products/:id')
  findCategoryWithProducts(@Param('id') id: string) {
    Logger.log('::: Category Controller ::: findCategoryWithProducts()');
    return this.categoriesService.findCategoryWithProducts(id);
  }
  // /api/categories/delete-category/{category: id}
  @Delete('delete-category/:id')
  deleteCategory(@Param('id') id: string) {
    Logger.log('::: Category Controller ::: deleteCategory()');
    return this.categoriesService.deleteCategory(id);
  }
}
