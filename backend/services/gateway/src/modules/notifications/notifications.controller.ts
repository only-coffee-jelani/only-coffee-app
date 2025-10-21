import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';

@ApiTags('notifications')
@Controller('api/v1/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('register-device')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register device token for push notifications' })
  async registerDevice(
    @Request() req: any,
    @Body() registerDto: RegisterDeviceTokenDto,
  ) {
    const userId = req.user.id;

    await this.notificationsService.registerDeviceToken(
      userId,
      registerDto.deviceToken,
      registerDto.platform,
    );

    return {
      success: true,
      message: 'Device registered successfully',
    };
  }
}
