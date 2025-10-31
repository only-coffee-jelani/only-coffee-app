import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Promotion, PromotionType } from '@shared/database/entities';

@Injectable()
export class PromotionsService {
  constructor(
    @InjectRepository(Promotion)
    private readonly promotionRepository: Repository<Promotion>,
  ) {}

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
