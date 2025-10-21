import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PromoCodesService } from './promo-codes.service';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@shared/database/entities';

@ApiTags('Admin - Promo Codes')
@ApiBearerAuth()
@Controller('v1/admin/promo-codes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class PromoCodesController {
  constructor(private readonly promoCodesService: PromoCodesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new promo code' })
  @ApiResponse({ status: 201, description: 'Promo code created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'Promo code already exists' })
  async createPromoCode(
    @Body() createPromoCodeDto: CreatePromoCodeDto,
    @CurrentUser() user: any,
  ) {
    const promoCode = await this.promoCodesService.createPromoCode({
      ...createPromoCodeDto,
      expiresAt: createPromoCodeDto.expiresAt
        ? new Date(createPromoCodeDto.expiresAt)
        : undefined,
      createdBy: user.id,
    });

    return {
      success: true,
      data: promoCode,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all promo codes with statistics' })
  @ApiResponse({ status: 200, description: 'List of promo codes' })
  async getAllPromoCodes(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('isActive') isActive?: boolean,
  ) {
    const result = await this.promoCodesService.getAllPromoCodes({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      isActive: isActive !== undefined ? isActive === true : undefined,
    });

    return {
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: page || 1,
        limit: limit || 50,
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get promo code details by ID' })
  @ApiResponse({ status: 200, description: 'Promo code details' })
  @ApiResponse({ status: 404, description: 'Promo code not found' })
  async getPromoCodeById(@Param('id') id: string) {
    const promoCode = await this.promoCodesService.getPromoCodeById(id);

    return {
      success: true,
      data: promoCode,
    };
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get promo code usage statistics' })
  @ApiResponse({ status: 200, description: 'Promo code statistics' })
  @ApiResponse({ status: 404, description: 'Promo code not found' })
  async getPromoCodeStats(@Param('id') id: string) {
    const stats = await this.promoCodesService.getPromoCodeStats(id);

    return {
      success: true,
      data: stats,
    };
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate a promo code' })
  @ApiResponse({ status: 200, description: 'Promo code deactivated' })
  @ApiResponse({ status: 404, description: 'Promo code not found' })
  async deactivatePromoCode(@Param('id') id: string) {
    const promoCode = await this.promoCodesService.deactivatePromoCode(id);

    return {
      success: true,
      message: 'Promo code deactivated',
      data: promoCode,
    };
  }
}
