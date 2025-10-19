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
      .where('splash.isActive = :isActive', { isActive: true })
      .andWhere(
        '(splash.startDate IS NULL OR splash.startDate <= :now)',
        { now },
      )
      .andWhere(
        '(splash.endDate IS NULL OR splash.endDate >= :now)',
        { now },
      )
      .orderBy('splash.createdAt', 'DESC')
      .getOne();
  }

  /**
   * Get all splash screens (for admin)
   */
  async getAllSplashScreens(skip = 0, take = 10): Promise<[SplashScreen[], number]> {
    return this.splashScreenRepository.findAndCount({
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
      where: { id },
    });

    if (!splashScreen) {
      throw new NotFoundException(`Splash screen with ID ${id} not found`);
    }

    return splashScreen;
  }

  /**
   * Create a new splash screen
   * If a new splash screen is created while one is active, mark the old one as replaced
   */
  async createSplashScreen(data: Partial<SplashScreen>, userId?: string): Promise<SplashScreen> {
    let previousActiveId: string | null = null;

    // Clean up empty strings to null for UUID fields
    const cleanedData = {
      ...data,
      targetMenuItemId: data.targetMenuItemId === '' ? null : data.targetMenuItemId,
      targetUrl: data.targetUrl === '' ? null : data.targetUrl,
      createdById: userId || null,
    };

    // If this new splash screen is active, deactivate any previous active splash screen
    if (cleanedData.isActive) {
      const currentActive = await this.splashScreenRepository.findOne({
        where: { isActive: true },
        order: { createdAt: 'DESC' },
      });

      if (currentActive) {
        previousActiveId = currentActive.id;
        await this.splashScreenRepository.update(
          { id: currentActive.id },
          {
            isActive: false,
            replacedAt: new Date(),
          },
        );
      }
    }

    const splashScreen = this.splashScreenRepository.create(cleanedData);
    const savedSplashScreen = await this.splashScreenRepository.save(splashScreen);

    // Update the previous splash screen with the ID of the new one
    if (previousActiveId) {
      await this.splashScreenRepository.update(
        { id: previousActiveId },
        { replacedById: savedSplashScreen.id },
      );
    }

    return savedSplashScreen;
  }

  /**
   * Update a splash screen
   * If setting isActive to true, deactivate any other active splash screens
   */
  async updateSplashScreen(id: string, data: Partial<SplashScreen>): Promise<SplashScreen> {
    const splashScreen = await this.getSplashScreenById(id);

    // If trying to set this splash screen as active
    if (data.isActive === true) {
      // Find any other active splash screens
      const otherActive = await this.splashScreenRepository.findOne({
        where: { isActive: true },
      });

      // If there's another active splash screen, deactivate it and mark as replaced
      if (otherActive && otherActive.id !== id) {
        await this.splashScreenRepository.update(
          { id: otherActive.id },
          {
            isActive: false,
            replacedAt: new Date(),
            replacedById: id,
          },
        );
      }
    }

    Object.assign(splashScreen, data);
    return this.splashScreenRepository.save(splashScreen);
  }

  /**
   * Delete a splash screen
   */
  async deleteSplashScreen(id: string): Promise<void> {
    const result = await this.splashScreenRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Splash screen with ID ${id} not found`);
    }
  }

  /**
   * Record an impression (view)
   */
  async recordImpression(id: string): Promise<void> {
    await this.splashScreenRepository.increment(
      { id },
      'impressions',
      1,
    );
    await this.splashScreenRepository.update(
      { id },
      { lastImpressionAt: new Date() },
    );
  }

  /**
   * Record a click
   */
  async recordClick(id: string): Promise<void> {
    await this.splashScreenRepository.increment(
      { id },
      'clicks',
      1,
    );
    await this.splashScreenRepository.update(
      { id },
      { lastClickAt: new Date() },
    );
    // Update CTR
    await this.updateMetrics(id);
  }

  /**
   * Record a skip
   */
  async recordSkip(id: string): Promise<void> {
    await this.splashScreenRepository.increment(
      { id },
      'skips',
      1,
    );
    // Update skip rate
    await this.updateMetrics(id);
  }

  /**
   * Update calculated metrics (CTR, skip rate, conversion rate)
   */
  async updateMetrics(id: string): Promise<void> {
    const splashScreen = await this.getSplashScreenById(id);
    
    const totalInteractions = splashScreen.impressions + splashScreen.skips;
    
    // Calculate CTR
    const ctr = splashScreen.impressions > 0 
      ? (splashScreen.clicks / splashScreen.impressions) * 100 
      : 0;
    
    // Calculate skip rate
    const skipRate = totalInteractions > 0 
      ? (splashScreen.skips / totalInteractions) * 100 
      : 0;
    
    // Calculate conversion rate
    const conversionRate = splashScreen.impressions > 0 
      ? (splashScreen.associatedOrders / splashScreen.impressions) * 100 
      : 0;
    
    // Calculate average order value
    const averageOrderValue = splashScreen.associatedOrders > 0 
      ? splashScreen.associatedRevenue / splashScreen.associatedOrders 
      : 0;

    await this.splashScreenRepository.update(
      { id },
      {
        ctr: parseFloat(ctr.toFixed(2)),
        skipRate: parseFloat(skipRate.toFixed(2)),
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
      },
    );
  }

  /**
   * Record associated order (for sales tracking)
   */
  async recordAssociatedOrder(id: string, orderValue: number): Promise<void> {
    await this.splashScreenRepository.increment(
      { id },
      'associatedOrders',
      1,
    );
    await this.splashScreenRepository.increment(
      { id },
      'associatedRevenue',
      orderValue,
    );
    await this.updateMetrics(id);
  }

  /**
   * Get analytics for a splash screen
   */
  async getAnalytics(id: string): Promise<any> {
    const splashScreen = await this.getSplashScreenById(id);

    return {
      id: splashScreen.id,
      title: splashScreen.title,
      impressions: splashScreen.impressions,
      clicks: splashScreen.clicks,
      skips: splashScreen.skips,
      ctr: splashScreen.ctr,
      skipRate: splashScreen.skipRate,
      associatedOrders: splashScreen.associatedOrders,
      associatedRevenue: splashScreen.associatedRevenue,
      conversionRate: splashScreen.conversionRate,
      averageOrderValue: splashScreen.averageOrderValue,
      uniqueUsersShown: splashScreen.uniqueUsersShown,
      uniqueUsersClicked: splashScreen.uniqueUsersClicked,
      averageViewTime: splashScreen.averageViewTime,
      lastImpressionAt: splashScreen.lastImpressionAt,
      lastClickAt: splashScreen.lastClickAt,
      startDate: splashScreen.startDate,
      endDate: splashScreen.endDate,
      isActive: splashScreen.isActive,
      createdAt: splashScreen.createdAt,
      replacedAt: splashScreen.replacedAt,
      replacedById: splashScreen.replacedById,
    };
  }
}

