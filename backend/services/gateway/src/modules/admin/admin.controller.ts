import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin login' })
  async login(@Body() body: { email: string; password: string }) {
    return this.adminService.login(body.email, body.password);
  }

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

  @Post('create-allergen-tables')
  @Public()
  @ApiOperation({ summary: 'Create allergen tables and seed data' })
  async createAllergenTables() {
    return this.adminService.createAllergenTables();
  }
}
