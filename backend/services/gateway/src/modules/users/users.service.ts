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
    return this.userRepository.findOne({ where: { userId: id } });
  }

  async updateProfile(userId: string, updates: Partial<User>) {
    await this.userRepository.update(userId, updates);
    return this.findById(userId);
  }

  async getLoyaltyInfo(userId: string) {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Note: In new schema, loyalty points are tracked in loyalty_ledger table
    // and tier is a FK to loyalty_tiers table
    // This is a simplified version for backward compatibility
    return {
      points: 0, // TODO: Calculate from loyalty_ledger
      tier: user.loyaltyTierId, // Returns UUID of tier
      nextTierPoints: 0, // TODO: Calculate based on tier thresholds
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
