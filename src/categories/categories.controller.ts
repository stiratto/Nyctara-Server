import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Logger,
  UseGuards
} from '@nestjs/common';

import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { Category } from './interfaces/category.interfaces';
import { Product } from 'src/products/interfaces/product.interfaces';
import { AuthGuard } from 'src/auth/auth.guard';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('api/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) { }
  private readonly logger = new Logger(CategoriesService.name)

  // CREATE NEW CATEGORY: /api/categories/create-category
  @UseGuards(AuthGuard)
  @Post('/create-category')
  createCategory(
    @Body() category: CreateCategoryDto,
  ): Promise<Category> {
    console.log(category.category_name)
    this.logger.log(`createNewCategory() ${category.category_name}`)
    return this.categoriesService.createCategory(category);
  }

  // /api/categories/
  @Get()
  getAllCategories(): Promise<Category[]> {
    this.logger.log(`getAllCategories()`)
    return this.categoriesService.getAllCategories();
  }

  // /api/categories/{category: id}
  @Get(':category?')
  getAllCategoriesExcludingOne(@Param('category') category: string): Promise<Category[]> {
    this.logger.log(`getAllCategoriesExcludingOne() ${category}`)
    return this.categoriesService.getAllCategoriesExcludingOne(category);
  }

  // /api/categories/findCategory/{category: id}
  @Get('find-category/:id')
  findCategoryById(@Param('id') id: string): Promise<Category> {
    this.logger.log(`findCategoryById() ${id}`)
    return this.categoriesService.findCategoryById(id);
  }

  // /api/categories/updateCategory/{category: id}
  @UseGuards(AuthGuard)
  @Patch('update-category/:id')
  updateCategory(
    @Body() category: UpdateCategoryDto,
    @Param('id') id: string,
  ): Promise<Category> {
    console.log(category)
    this.logger.log(`updateCategory() ${category.category_name}`)
    return this.categoriesService.updateCategory(id, category);
  }

  // FIND SINGLE CATEGORY WITH PRODUCTS:
  // /api/categories/findCategoryWithProducts/:id
  @Get('find-category-with-products/:id')
  findCategoryWithProducts(@Param('id') id: string): Promise<Product[]> {
    this.logger.log(`findCategoryWithProducts() ${id}`)
    return this.categoriesService.findCategoryWithProducts(id);
  }
  // /api/categories/delete-category/{category: id}
  @Delete('delete-category/:id')
  deleteCategory(@Param('id') id: string): Promise<Category> {
    this.logger.log(`deleteCategory() ${id}`)
    return this.categoriesService.deleteCategory(id);
  }
}
