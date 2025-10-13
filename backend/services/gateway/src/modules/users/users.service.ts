import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@shared/database/entities';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findById(id: string) {
    return this.userRepository.findOne({ where: { id } });
  }

  async updateProfile(userId: string, updates: Partial<User>) {
    await this.userRepository.update(userId, updates);
    return this.findById(userId);
  }

  async getLoyaltyInfo(userId: string) {
    const user = await this.findById(userId);
    return {
      points: user.loyaltyPoints,
      tier: user.loyaltyTier,
      nextTierPoints: this.calculateNextTierPoints(user.loyaltyPoints),
    };
  }

  private calculateNextTierPoints(currentPoints: number): number {
    // Silver: 0-999 points
    // Gold: 1000-4999 points
    // Platinum: 5000+ points
    if (currentPoints < 1000) return 1000 - currentPoints;
    if (currentPoints < 5000) return 5000 - currentPoints;
    return 0; // Already at max tier
  }
}
