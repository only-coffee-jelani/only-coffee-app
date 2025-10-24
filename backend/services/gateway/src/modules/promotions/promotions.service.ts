import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Promotion, PromotionType, SplashScreen } from '@shared/database/entities';

@Injectable()
export class PromotionsService {
  constructor(
    @InjectRepository(Promotion)
    private readonly promotionRepository: Repository<Promotion>,
    @InjectRepository(SplashScreen)
    private readonly splashScreenRepository: Repository<SplashScreen>,
  ) {}

  async getActiveLaunchModal() {
    const now = new Date();

    // Query splash_screens table instead of promotions
    const splashScreen = await this.splashScreenRepository
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

    // If no splash screen found, return null
    if (!splashScreen) {
      return null;
    }

    // Transform SplashScreen to Promotion format for iOS app compatibility
    const promotion: Promotion = {
      id: splashScreen.id,
      title: splashScreen.title,
      description: splashScreen.description,
      promotionType: PromotionType.LAUNCH_MODAL,
      imageUrl: splashScreen.imageUrl,
      targetMenuItemId: splashScreen.targetMenuItemId,
      targetUrl: splashScreen.targetUrl,
      startDate: splashScreen.startDate,
      endDate: splashScreen.endDate,
      isActive: splashScreen.isActive,
      displayDuration: splashScreen.displayDuration,
      sortOrder: 0, // Default value since splash screens don't have sortOrder
      createdAt: splashScreen.createdAt,
      updatedAt: splashScreen.updatedAt,
    };

    return promotion;
  }

  async getActivePromotions(promotionType?: PromotionType) {
    const now = new Date();

    const queryBuilder = this.promotionRepository
      .createQueryBuilder('promotion')
      .where('promotion.isActive = :isActive', { isActive: true })
      .andWhere('promotion.startDate <= :now', { now })
      .andWhere('promotion.endDate >= :now', { now })
      .orderBy('promotion.sortOrder', 'ASC')
      .addOrderBy('promotion.createdAt', 'DESC');

    if (promotionType) {
      queryBuilder.andWhere('promotion.promotionType = :promotionType', { promotionType });
    }

    return queryBuilder.getMany();
  }

  async findById(id: string) {
    return this.promotionRepository.findOne({ where: { id } });
  }

  async create(data: Partial<Promotion>) {
    const promotion = this.promotionRepository.create(data);
    return this.promotionRepository.save(promotion);
  }

  async update(id: string, data: Partial<Promotion>) {
    await this.promotionRepository.update(id, data);
    return this.findById(id);
  }

  async delete(id: string) {
    const result = await this.promotionRepository.delete(id);
    return result.affected > 0;
  }
}
