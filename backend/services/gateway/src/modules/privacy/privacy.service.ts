import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Event, Order } from '@shared/database/entities';
import {
  PrivacyRequest,
  PrivacyRequestType,
  PrivacyRequestStatus,
} from './entities/privacy-request.entity';

@Injectable()
export class PrivacyService {
  private readonly logger = new Logger(PrivacyService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(PrivacyRequest)
    private readonly privacyRequestRepository: Repository<PrivacyRequest>,
  ) {}

  /**
   * Request data export (GDPR Article 15 - Right of Access)
   */
  async requestDataExport(userId: string): Promise<{
    success: boolean;
    message: string;
    requestId: string;
    estimatedCompletionTime?: string;
    downloadUrl?: string;
  }> {
    this.logger.log(`Data export requested for user: ${userId}`);

    try {
      // Check if there's already a pending request
      const existingRequest = await this.privacyRequestRepository.findOne({
        where: {
          userId,
          requestType: PrivacyRequestType.DATA_EXPORT,
          status: PrivacyRequestStatus.PENDING,
        },
      });

      if (existingRequest) {
        return {
          success: true,
          message:
            'You already have a pending data export request. We will notify you when it\'s ready.',
          requestId: existingRequest.id,
          estimatedCompletionTime: this.calculateEstimatedTime(
            existingRequest.createdAt,
          ),
        };
      }

      // Create new privacy request
      const request = this.privacyRequestRepository.create({
        userId,
        requestType: PrivacyRequestType.DATA_EXPORT,
        status: PrivacyRequestStatus.PENDING,
      });

      await this.privacyRequestRepository.save(request);

      // In production, this would trigger a background job to:
      // 1. Collect all user data from all services
      // 2. Generate a ZIP file with JSON/CSV files
      // 3. Upload to S3 with signed URL
      // 4. Send email notification to user
      // For now, we'll mark it as processing and simulate the export

      // Simulate export process (in production, use a queue system)
      setTimeout(
        () => this.processDataExport(request.id),
        5000, // Simulate 5 second delay
      );

      return {
        success: true,
        message:
          'Your data export request has been received. We will prepare your data and send you a download link within 48 hours.',
        requestId: request.id,
        estimatedCompletionTime: '48 hours',
      };
    } catch (error) {
      this.logger.error('Failed to create data export request', error);
      throw error;
    }
  }

  /**
   * Process data export request (would be run by background job in production)
   */
  private async processDataExport(requestId: string): Promise<void> {
    try {
      const request = await this.privacyRequestRepository.findOne({
        where: { id: requestId },
      });

      if (!request) {
        this.logger.error(`Privacy request not found: ${requestId}`);
        return;
      }

      // Update status to processing
      request.status = PrivacyRequestStatus.PROCESSING;
      await this.privacyRequestRepository.save(request);

      // Collect user data
      const userData = await this.collectUserData(request.userId);

      // In production:
      // 1. Generate ZIP file with all data
      // 2. Upload to S3
      // 3. Generate signed URL (expires in 7 days)
      // 4. Send email with download link

      // For now, just simulate success
      const mockDownloadUrl = `https://s3.amazonaws.com/only-coffee-exports/${requestId}.zip`;

      request.status = PrivacyRequestStatus.COMPLETED;
      request.processedAt = new Date();
      request.downloadUrl = mockDownloadUrl;
      await this.privacyRequestRepository.save(request);

      this.logger.log(`Data export completed for request: ${requestId}`);
    } catch (error) {
      this.logger.error('Failed to process data export', error);

      // Mark request as failed
      await this.privacyRequestRepository.update(requestId, {
        status: PrivacyRequestStatus.FAILED,
      });
    }
  }

  /**
   * Collect all user data for export
   */
  private async collectUserData(userId: string): Promise<any> {
    const [user, events, orders] = await Promise.all([
      this.userRepository.findOne({ where: { id: userId } }),
      this.eventRepository.find({
        where: { userId },
        order: { timestamp: 'DESC' },
        take: 1000, // Limit to last 1000 events
      }),
      this.orderRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
      }),
    ]);

    return {
      personal_information: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        name: user.name,
        created_at: user.createdAt,
        profile_completed: user.profileCompleted,
      },
      preferences: user.preferences,
      events: events.map((e) => ({
        event_type: e.eventType,
        timestamp: e.timestamp,
        metadata: e.metadata,
      })),
      orders: orders.map((o) => ({
        id: o.id,
        store_id: o.storeId,
        total_amount: o.totalAmount,
        status: o.status,
        created_at: o.createdAt,
        items: o.items,
      })),
      // Would also include:
      // - Promotions used
      // - Rewards/points
      // - Location history
      // - Device information
      // - Communication preferences
    };
  }

  /**
   * Request account and data deletion (GDPR Article 17 - Right to Erasure)
   */
  async requestDataDeletion(
    userId: string,
    reason?: string,
  ): Promise<{
    success: boolean;
    message: string;
    requestId: string;
    deletionScheduledAt?: string;
  }> {
    this.logger.log(`Data deletion requested for user: ${userId}`);

    try {
      // Check if there's already a pending request
      const existingRequest = await this.privacyRequestRepository.findOne({
        where: {
          userId,
          requestType: PrivacyRequestType.DATA_DELETION,
          status: PrivacyRequestStatus.PENDING,
        },
      });

      if (existingRequest) {
        return {
          success: true,
          message:
            'You already have a pending account deletion request. Your account will be deleted on the scheduled date.',
          requestId: existingRequest.id,
          deletionScheduledAt: existingRequest.scheduledDeletionAt?.toISOString(),
        };
      }

      // Schedule deletion 30 days from now (grace period for user to cancel)
      const scheduledDeletionAt = new Date();
      scheduledDeletionAt.setDate(scheduledDeletionAt.getDate() + 30);

      // Create deletion request
      const request = this.privacyRequestRepository.create({
        userId,
        requestType: PrivacyRequestType.DATA_DELETION,
        status: PrivacyRequestStatus.PENDING,
        reason: reason || 'User requested account deletion',
        scheduledDeletionAt,
      });

      await this.privacyRequestRepository.save(request);

      // In production, this would:
      // 1. Send confirmation email with cancellation link
      // 2. Schedule deletion job for 30 days from now
      // 3. Disable user account immediately (soft delete)
      // 4. After 30 days, permanently delete all data (hard delete)

      // Soft delete the user immediately
      await this.userRepository.update(userId, {
        isActive: false,
        deletedAt: new Date(),
      });

      return {
        success: true,
        message:
          'Your account deletion request has been received. Your account has been deactivated and will be permanently deleted in 30 days. You can cancel this request within the next 30 days if you change your mind.',
        requestId: request.id,
        deletionScheduledAt: scheduledDeletionAt.toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to create data deletion request', error);
      throw error;
    }
  }

  /**
   * Cancel pending deletion request
   */
  async cancelDataDeletion(userId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const request = await this.privacyRequestRepository.findOne({
      where: {
        userId,
        requestType: PrivacyRequestType.DATA_DELETION,
        status: PrivacyRequestStatus.PENDING,
      },
    });

    if (!request) {
      return {
        success: false,
        message: 'No pending deletion request found.',
      };
    }

    // Cancel the request
    request.status = PrivacyRequestStatus.CANCELLED;
    await this.privacyRequestRepository.save(request);

    // Restore user account
    await this.userRepository.update(userId, {
      isActive: true,
      deletedAt: null,
    });

    return {
      success: true,
      message:
        'Your account deletion request has been cancelled. Your account has been restored.',
    };
  }

  /**
   * Permanently delete user data (executed after grace period)
   */
  async permanentlyDeleteUserData(userId: string): Promise<void> {
    this.logger.log(`Permanently deleting data for user: ${userId}`);

    try {
      // Delete all user data from all tables
      // Note: In production, you'd want to:
      // 1. Archive data for legal/compliance reasons
      // 2. Delete in batches to avoid performance issues
      // 3. Delete from all microservices
      // 4. Remove from caches, search indexes, etc.

      await Promise.all([
        this.eventRepository.delete({ userId }),
        this.orderRepository.delete({ userId }),
        this.privacyRequestRepository.delete({ userId }),
        // Delete from other tables...
      ]);

      // Finally, delete the user
      await this.userRepository.delete({ id: userId });

      this.logger.log(`Successfully deleted all data for user: ${userId}`);
    } catch (error) {
      this.logger.error('Failed to permanently delete user data', error);
      throw error;
    }
  }

  /**
   * Get user's privacy requests
   */
  async getUserPrivacyRequests(userId: string): Promise<PrivacyRequest[]> {
    return this.privacyRequestRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Calculate estimated completion time
   */
  private calculateEstimatedTime(createdAt: Date): string {
    const now = new Date();
    const hoursElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    const hoursRemaining = Math.max(0, 48 - hoursElapsed);

    if (hoursRemaining < 1) {
      return 'Less than 1 hour';
    } else if (hoursRemaining < 24) {
      return `${Math.ceil(hoursRemaining)} hours`;
    } else {
      return `${Math.ceil(hoursRemaining / 24)} days`;
    }
  }
}
