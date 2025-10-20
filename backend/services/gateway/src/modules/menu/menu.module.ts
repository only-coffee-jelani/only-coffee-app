import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuItem } from '@shared/database/entities';
import { MenuController } from './menu.controller';
import { MenuItemsController } from './menu-items.controller';
import { MenuService } from './menu.service';

@Module({
  imports: [TypeOrmModule.forFeature([MenuItem])],
  controllers: [MenuController, MenuItemsController],
  providers: [MenuService],
  exports: [MenuService],
})
export class MenuModule {}
