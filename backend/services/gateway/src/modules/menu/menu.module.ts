import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuItem, MenuCategory, Allergen } from '@shared/database/entities';
import { MenuController } from './menu.controller';
import { MenuItemsController } from './menu-items.controller';
import { CategoriesController } from './categories.controller';
import { AllergensController } from './allergens.controller';
import { MenuService } from './menu.service';
import { CategoriesService } from './categories.service';
import { AllergensService } from './allergens.service';

@Module({
  imports: [TypeOrmModule.forFeature([MenuItem, MenuCategory, Allergen])],
  controllers: [MenuController, MenuItemsController, CategoriesController, AllergensController],
  providers: [MenuService, CategoriesService, AllergensService],
  exports: [MenuService, CategoriesService, AllergensService],
})
export class MenuModule {}
