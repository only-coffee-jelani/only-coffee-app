import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnonymousDevice } from '@shared/database/entities/anonymous-device.entity';
import { UserDevice } from '@shared/database/entities/user-device.entity';

/**
 * Service for managing anonymous devices
 * Handles device lifecycle: anonymous → registered
 */
@Injectable()
export class AnonymousDeviceService {
  private readonly logger = new Logger(AnonymousDeviceService.name);

  constructor(
    @InjectRepository(AnonymousDevice)
    private readonly anonymousDeviceRepository: Repository<AnonymousDevice>,
    @InjectRepository(UserDevice)
    private readonly userDeviceRepository: Repository<UserDevice>,
  ) {}

  /**
   * Register or update an anonymous device
   */
  async registerAnonymousDevice(
    deviceId: string,
    deviceType?: string,
    appVersion?: string,
    osVersion?: string,
    deviceModel?: string,
  ): Promise<AnonymousDevice> {
    try {
      // Check if device already exists
      let device = await this.anonymousDeviceRepository.findOne({
        where: { deviceId },
      });

      if (device) {
        // Update last active time and other fields
        device.lastActiveAt = new Date();
        if (deviceType) device.deviceType = deviceType;
        if (appVersion) device.appVersion = appVersion;
        if (osVersion) device.osVersion = osVersion;
        if (deviceModel) device.deviceModel = deviceModel;
        
        await this.anonymousDeviceRepository.save(device);
        this.logger.log(`Updated anonymous device: ${deviceId}`);
      } else {
        // Create new anonymous device
        device = this.anonymousDeviceRepository.create({
          deviceId,
          deviceType,
          appVersion,
          osVersion,
          deviceModel,
          firstSeenAt: new Date(),
          lastActiveAt: new Date(),
        });
        
        await this.anonymousDeviceRepository.save(device);
        this.logger.log(`Registered new anonymous device: ${deviceId}`);
      }

      return device;
    } catch (error) {
      this.logger.error(`Failed to register anonymous device: ${deviceId}`, error);
      throw error;
    }
  }

  /**
   * Migrate an anonymous device to a registered user device
   * Called when user logs in or registers
   */
  async migrateToUserDevice(
    deviceId: string,
    userId: string,
    pushToken?: string,
  ): Promise<UserDevice> {
    try {
      // Get the anonymous device
      const anonymousDevice = await this.anonymousDeviceRepository.findOne({
        where: { deviceId },
      });

      if (!anonymousDevice) {
        throw new Error(`Anonymous device not found: ${deviceId}`);
      }

      // Create user device with same device_id
      const userDevice = this.userDeviceRepository.create({
        deviceId: anonymousDevice.deviceId,
        userId,
        deviceType: anonymousDevice.deviceType,
        appVersion: anonymousDevice.appVersion,
        osVersion: anonymousDevice.osVersion,
        pushToken,
        lastActiveAt: new Date(),
      });

      await this.userDeviceRepository.save(userDevice);

      // Delete the anonymous device record
      await this.anonymousDeviceRepository.delete({ deviceId });

      this.logger.log(
        `Migrated device ${deviceId} from anonymous to user ${userId}`,
      );

      return userDevice;
    } catch (error) {
      this.logger.error(
        `Failed to migrate device ${deviceId} to user ${userId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Check if a device is anonymous or registered
   */
  async getDeviceStatus(deviceId: string): Promise<{
    isAnonymous: boolean;
    userId?: string;
  }> {
    // Check if it's a registered device
    const userDevice = await this.userDeviceRepository.findOne({
      where: { deviceId },
    });

    if (userDevice) {
      return { isAnonymous: false, userId: userDevice.userId };
    }

    // Check if it's an anonymous device
    const anonymousDevice = await this.anonymousDeviceRepository.findOne({
      where: { deviceId },
    });

    if (anonymousDevice) {
      return { isAnonymous: true };
    }

    // Device not found
    return { isAnonymous: true }; // Assume new anonymous device
  }

  /**
   * Clean up old anonymous devices (e.g., older than 90 days)
   */
  async cleanupOldAnonymousDevices(daysOld: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.anonymousDeviceRepository
      .createQueryBuilder()
      .delete()
      .where('last_active_at < :cutoffDate', { cutoffDate })
      .execute();

    this.logger.log(
      `Cleaned up ${result.affected} anonymous devices older than ${daysOld} days`,
    );

    return result.affected || 0;
  }
}

