import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuItem, MenuCategory } from '@shared/database/entities';
import { MenuController } from './menu.controller';
import { MenuItemsController } from './menu-items.controller';
import { CategoriesController } from './categories.controller';
import { MenuService } from './menu.service';
import { CategoriesService } from './categories.service';

@Module({
  imports: [TypeOrmModule.forFeature([MenuItem, MenuCategory])],
  controllers: [MenuController, MenuItemsController, CategoriesController],
  providers: [MenuService, CategoriesService],
  exports: [MenuService, CategoriesService],
})
export class MenuModule {}
