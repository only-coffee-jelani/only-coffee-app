import { Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('run-migrations')
  @Public()
  @ApiOperation({ summary: 'Run pending database migrations' })
  async runMigrations() {
    return this.adminService.runMigrations();
  }

  @Post('create-promotions-table')
  @Public()
  @ApiOperation({ summary: 'Create promotions table' })
  async createPromotionsTable() {
    return this.adminService.createPromotionsTable();
  }
}
