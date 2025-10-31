import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PrivacyService } from './privacy.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('privacy')
@UseGuards(JwtAuthGuard)
export class PrivacyController {
  constructor(private readonly privacyService: PrivacyService) {}

  /**
   * Request data export (GDPR Article 15)
   * POST /api/v1/privacy/data-export
   */
  @Post('data-export')
  @HttpCode(HttpStatus.OK)
  async requestDataExport(@Request() req) {
    const userId = req.user.userId;
    return this.privacyService.requestDataExport(userId);
  }

  /**
   * Request account and data deletion (GDPR Article 17)
   * POST /api/v1/privacy/data-deletion
   */
  @Post('data-deletion')
  @HttpCode(HttpStatus.OK)
  async requestDataDeletion(
    @Request() req,
    @Body() body: { reason?: string },
  ) {
    const userId = req.user.userId;
    return this.privacyService.requestDataDeletion(userId, body.reason);
  }

  /**
   * Cancel pending deletion request
   * POST /api/v1/privacy/cancel-deletion
   */
  @Post('cancel-deletion')
  @HttpCode(HttpStatus.OK)
  async cancelDataDeletion(@Request() req) {
    const userId = req.user.userId;
    return this.privacyService.cancelDataDeletion(userId);
  }

  /**
   * Get user's privacy requests
   * GET /api/v1/privacy/requests
   */
  @Get('requests')
  async getPrivacyRequests(@Request() req) {
    const userId = req.user.userId;
    const requests = await this.privacyService.getUserPrivacyRequests(userId);

    return {
      success: true,
      requests: requests.map((r) => ({
        id: r.id,
        request_type: r.requestType,
        status: r.status,
        reason: r.reason,
        download_url: r.downloadUrl,
        processed_at: r.processedAt,
        scheduled_deletion_at: r.scheduledDeletionAt,
        created_at: r.createdAt,
      })),
    };
  }
}
