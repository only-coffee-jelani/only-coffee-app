import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SplashScreen } from '@shared/database/entities';

@Injectable()
export class SplashScreenService {
  constructor(
    @InjectRepository(SplashScreen)
    private readonly splashScreenRepository: Repository<SplashScreen>,
  ) {}

  /**
   * Get the current active splash screen
   */
  async getCurrentSplashScreen(): Promise<SplashScreen | null> {
    const now = new Date();
    return this.splashScreenRepository
      .createQueryBuilder('splash')
      .leftJoinAndSelect('splash.imageAsset', 'imageAsset')
      .where('splash.isActive = :isActive', { isActive: true })
      .andWhere(
        '(splash.startAt IS NULL OR splash.startAt <= :now)',
        { now },
      )
      .andWhere(
        '(splash.endAt IS NULL OR splash.endAt >= :now)',
        { now },
      )
      .orderBy('splash.priority', 'DESC')
      .addOrderBy('splash.createdAt', 'DESC')
      .getOne();
  }

  /**
   * Get all splash screens (for admin)
   */
  async getAllSplashScreens(skip = 0, take = 10): Promise<[SplashScreen[], number]> {
    return this.splashScreenRepository.findAndCount({
      relations: ['imageAsset'],
      order: { createdAt: 'DESC' },
      skip,
      take,
    });
  }

  /**
   * Get a specific splash screen by ID
   */
  async getSplashScreenById(id: string): Promise<SplashScreen> {
    const splashScreen = await this.splashScreenRepository.findOne({
      where: { splashId: id },
      relations: ['imageAsset'],
    });

    if (!splashScreen) {
      throw new NotFoundException(`Splash screen with ID ${id} not found`);
    }

    return splashScreen;
  }

  /**
   * Create a new splash screen
   * Only one splash screen can be active at a time
   */
  async createSplashScreen(data: any, userId?: string): Promise<SplashScreen> {
    // If creating an active splash screen, deactivate all others first
    if (data.isActive) {
      await this.splashScreenRepository.update(
        { isActive: true },
        { isActive: false },
      );
    }

    // Clean up empty strings to null for UUID fields and convert date strings to Date objects
    const cleanedData = {
      ...data,
      startAt: data.startAt ? new Date(data.startAt) : null,
      endAt: data.endAt ? new Date(data.endAt) : null,
      targetSegmentId: data.targetSegmentId === '' ? null : data.targetSegmentId,
      targetStoreId: data.targetStoreId === '' ? null : data.targetStoreId,
      deeplink: data.deeplink === '' ? null : data.deeplink,
      createdBy: userId || null,
    };

    const splashScreen = this.splashScreenRepository.create(cleanedData);
    const saved = await this.splashScreenRepository.save(splashScreen);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  /**
   * Update a splash screen
   * Only one splash screen can be active at a time
   */
  async updateSplashScreen(id: string, data: any): Promise<SplashScreen> {
    const splashScreen = await this.getSplashScreenById(id);

    // If activating this splash screen, deactivate all others first
    if (data.isActive && !splashScreen.isActive) {
      await this.splashScreenRepository.update(
        { isActive: true },
        { isActive: false },
      );
    }

    // Clean up empty strings to null for UUID fields and convert date strings to Date objects
    const cleanedData = {
      ...data,
      startAt: data.startAt ? new Date(data.startAt) : undefined,
      endAt: data.endAt ? new Date(data.endAt) : undefined,
      targetSegmentId: data.targetSegmentId === '' ? null : data.targetSegmentId,
      targetStoreId: data.targetStoreId === '' ? null : data.targetStoreId,
      deeplink: data.deeplink === '' ? null : data.deeplink,
    };

    Object.assign(splashScreen, cleanedData);
    return this.splashScreenRepository.save(splashScreen);
  }

  /**
   * Delete a splash screen
   */
  async deleteSplashScreen(id: string): Promise<void> {
    const result = await this.splashScreenRepository.delete({ splashId: id });
    if (result.affected === 0) {
      throw new NotFoundException(`Splash screen with ID ${id} not found`);
    }
  }

  /**
   * Record an impression (view)
   * Note: Analytics tracking removed from new schema
   * This method is kept for backward compatibility but does nothing
   */
  async recordImpression(id: string): Promise<void> {
    // Analytics tracking should be done in a separate analytics service/table
    // For now, this is a no-op
    return;
  }

  /**
   * Record a click
   * Note: Analytics tracking removed from new schema
   */
  async recordClick(id: string): Promise<void> {
    // Analytics tracking should be done in a separate analytics service/table
    return;
  }

  /**
   * Record a skip
   * Note: Analytics tracking removed from new schema
   */
  async recordSkip(id: string): Promise<void> {
    // Analytics tracking should be done in a separate analytics service/table
    return;
  }

  /**
   * Update calculated metrics (CTR, skip rate, conversion rate)
   * Note: Analytics tracking removed from new schema
   */
  async updateMetrics(id: string): Promise<void> {
    // Analytics tracking should be done in a separate analytics service/table
    return;
  }

  /**
   * Record associated order (for sales tracking)
   * Note: Analytics tracking removed from new schema
   */
  async recordAssociatedOrder(id: string, orderValue: number): Promise<void> {
    // Analytics tracking should be done in a separate analytics service/table
    return;
  }

  /**
   * Get analytics for a splash screen
   * Note: Analytics fields removed from new schema
   * Returns basic info only
   */
  async getAnalytics(id: string): Promise<any> {
    const splashScreen = await this.getSplashScreenById(id);

    return {
      id: splashScreen.splashId,
      title: splashScreen.title,
      subtitle: splashScreen.subtitle,
      durationSeconds: splashScreen.durationSeconds,
      startAt: splashScreen.startAt,
      endAt: splashScreen.endAt,
      isActive: splashScreen.isActive,
      priority: splashScreen.priority,
      deeplink: splashScreen.deeplink,
      createdAt: splashScreen.createdAt,
      updatedAt: splashScreen.updatedAt,
      // Analytics fields removed - should be tracked in separate analytics system
      impressions: 0,
      clicks: 0,
      skips: 0,
      ctr: 0,
      skipRate: 0,
    };
  }
}

