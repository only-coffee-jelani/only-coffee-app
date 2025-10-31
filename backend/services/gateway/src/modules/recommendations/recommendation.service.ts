import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Order, MenuItem, User } from '@shared/database/entities';
import { FeatureStoreService } from '../features/feature-store.service';

export interface RecommendedItem {
  menuItemId: string;
  name: string;
  score: number; // 0-1 relevance score
  reason: string; // Why this item is recommended
  category: string;
  basePrice: number;
  imageUrl?: string;
}

export interface RecommendationContext {
  userId?: string;
  currentTime?: Date;
  weather?: {
    temperature: number;
    condition: string;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
  segment?: string;
  limit?: number;
}

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);

  // Cache for item similarity matrix (in-memory for now, could move to Redis)
  private itemSimilarityCache = new Map<string, Map<string, number>>();

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(MenuItem)
    private readonly menuItemRepository: Repository<MenuItem>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly featureStoreService: FeatureStoreService,
  ) {
    // Build item similarity matrix on startup (in background)
    this.buildItemSimilarityMatrix().catch((err) => {
      this.logger.error('Failed to build item similarity matrix:', err);
    });
  }

  /**
   * Get personalized recommendations for a user
   * Combines multiple recommendation strategies
   */
  async getPersonalizedRecommendations(
    context: RecommendationContext,
  ): Promise<RecommendedItem[]> {
    const { userId, limit = 10 } = context;

    if (!userId) {
      // Return popular items for anonymous users
      return this.getPopularItems(limit);
    }

    // Get user features for context
    const features = await this.featureStoreService.getUserFeatures({
      userId,
    });

    const recommendations: RecommendedItem[] = [];

    // Strategy 1: Collaborative filtering based on purchase history (50% weight)
    const collaborativeRecs = await this.getCollaborativeFilteringRecs(userId, limit);
    recommendations.push(...collaborativeRecs.map((rec) => ({ ...rec, score: rec.score * 0.5 })));

    // Strategy 2: User's favorites and frequent items (30% weight)
    const frequentRecs = await this.getFrequentItemRecs(userId, limit);
    recommendations.push(...frequentRecs.map((rec) => ({ ...rec, score: rec.score * 0.3 })));

    // Strategy 3: Contextual recommendations (weather, time) (20% weight)
    const contextualRecs = await this.getContextualRecs(context, limit);
    recommendations.push(...contextualRecs.map((rec) => ({ ...rec, score: rec.score * 0.2 })));

    // Merge and deduplicate recommendations
    const merged = this.mergeRecommendations(recommendations);

    // Filter out items user already ordered recently
    const filtered = await this.filterRecentPurchases(userId, merged);

    // Sort by final score and return top N
    return filtered
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Collaborative filtering: "Users who bought X also bought Y"
   * Item-based collaborative filtering
   */
  async getCollaborativeFilteringRecs(
    userId: string,
    limit: number,
  ): Promise<RecommendedItem[]> {
    // Get user's purchase history
    const userOrders = await this.orderRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50, // Last 50 orders
    });

    if (userOrders.length === 0) {
      return this.getPopularItems(limit);
    }

    // Extract unique item IDs from orders
    const purchasedItemIds = new Set<string>();
    userOrders.forEach((order) => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          if (item.menuItemId) {
            purchasedItemIds.add(item.menuItemId);
          }
        });
      }
    });

    if (purchasedItemIds.size === 0) {
      return this.getPopularItems(limit);
    }

    // Find similar items using item-item similarity
    const similarItems = new Map<string, number>();

    for (const itemId of purchasedItemIds) {
      const similarities = this.itemSimilarityCache.get(itemId);
      if (similarities) {
        similarities.forEach((similarity, similarItemId) => {
          // Don't recommend items user already purchased
          if (!purchasedItemIds.has(similarItemId)) {
            const currentScore = similarItems.get(similarItemId) || 0;
            similarItems.set(similarItemId, currentScore + similarity);
          }
        });
      }
    }

    // Convert to RecommendedItem array
    const recommendations: RecommendedItem[] = [];

    for (const [itemId, score] of similarItems.entries()) {
      const menuItem = await this.menuItemRepository.findOne({
        where: { id: itemId, isActive: true },
      });

      if (menuItem) {
        recommendations.push({
          menuItemId: menuItem.id,
          name: menuItem.name,
          score: Math.min(score / purchasedItemIds.size, 1), // Normalize
          reason: 'Customers who bought your favorites also loved this',
          category: menuItem.category,
          basePrice: menuItem.basePrice,
          imageUrl: menuItem.imageUrl,
        });
      }
    }

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Recommend items based on user's frequent purchases
   */
  async getFrequentItemRecs(
    userId: string,
    limit: number,
  ): Promise<RecommendedItem[]> {
    // TODO: Re-enable when FeatureStoreService supports preferences
    // For now, return empty array to avoid type errors
    return [];

    /* Commented out until preferences are properly typed
    const features = await this.featureStoreService.getUserFeatures({
      userId,
    });

    const preferences = features as any; // Type cast needed
    const recommendations: RecommendedItem[] = [];

    // Recommend variations of favorite categories
    if (preferences.favoriteCategories && preferences.favoriteCategories.length > 0) {
      const topCategory = preferences.favoriteCategories[0];

      const categoryItems = await this.menuItemRepository.find({
        where: {
          category: topCategory,
          isActive: true,
        },
        take: limit,
      });

      for (const item of categoryItems) {
        // Check if this is not already in their purchase history
        recommendations.push({
          menuItemId: item.id,
          name: item.name,
          score: 0.8,
          reason: `You love ${topCategory}! Try this`,
          category: item.category,
          basePrice: item.basePrice,
          imageUrl: item.imageUrl,
        });
      }
    }

    // Recommend variations of favorite items (different sizes, temperatures)
    if (preferences.favoriteItems && preferences.favoriteItems.length > 0) {
      const favoriteItemIds = preferences.favoriteItems.slice(0, 3);

      for (const itemId of favoriteItemIds) {
        const similarItems = await this.findSimilarItems(itemId, 3);
        recommendations.push(...similarItems.map((item) => ({
          ...item,
          reason: 'Similar to your favorites',
        })));
      }
    }

    return recommendations.slice(0, limit);
    */
  }

  /**
   * Contextual recommendations based on time, weather, location
   */
  async getContextualRecs(
    context: RecommendationContext,
    limit: number,
  ): Promise<RecommendedItem[]> {
    const recommendations: RecommendedItem[] = [];
    const { currentTime = new Date(), weather } = context;

    const hour = currentTime.getHours();

    // Time-based recommendations
    if (hour >= 6 && hour < 11) {
      // Morning: Coffee, breakfast items
      const morningItems = await this.menuItemRepository.find({
        where: {
          category: In(['hot_coffee', 'breakfast']),
          isActive: true,
        },
        take: 5,
      });

      recommendations.push(...morningItems.map((item) => ({
        menuItemId: item.id,
        name: item.name,
        score: 0.9,
        reason: 'Perfect for your morning',
        category: item.category,
        basePrice: item.basePrice,
        imageUrl: item.imageUrl,
      })));
    } else if (hour >= 11 && hour < 14) {
      // Lunch: Food items, refreshing drinks
      const lunchItems = await this.menuItemRepository.find({
        where: {
          category: In(['food', 'iced_coffee']),
          isActive: true,
        },
        take: 5,
      });

      recommendations.push(...lunchItems.map((item) => ({
        menuItemId: item.id,
        name: item.name,
        score: 0.85,
        reason: 'Great for lunch',
        category: item.category,
        basePrice: item.basePrice,
        imageUrl: item.imageUrl,
      })));
    } else if (hour >= 14 && hour < 17) {
      // Afternoon: Pick-me-ups, snacks
      const afternoonItems = await this.menuItemRepository.find({
        where: {
          category: In(['espresso', 'snacks']),
          isActive: true,
        },
        take: 5,
      });

      recommendations.push(...afternoonItems.map((item) => ({
        menuItemId: item.id,
        name: item.name,
        score: 0.8,
        reason: 'Afternoon pick-me-up',
        category: item.category,
        basePrice: item.basePrice,
        imageUrl: item.imageUrl,
      })));
    }

    // Weather-based recommendations
    if (weather) {
      if (weather.temperature < 50) {
        // Cold weather: Hot drinks
        const hotItems = await this.menuItemRepository.find({
          where: {
            category: In(['hot_coffee', 'tea']),
            isActive: true,
          },
          take: 5,
        });

        recommendations.push(...hotItems.map((item) => ({
          menuItemId: item.id,
          name: item.name,
          score: 0.95,
          reason: `Perfect for ${weather.temperature}°F weather`,
          category: item.category,
          basePrice: item.basePrice,
          imageUrl: item.imageUrl,
        })));
      } else if (weather.temperature > 75) {
        // Hot weather: Cold drinks
        const coldItems = await this.menuItemRepository.find({
          where: {
            category: In(['iced_coffee', 'cold_brew', 'refreshers']),
            isActive: true,
          },
          take: 5,
        });

        recommendations.push(...coldItems.map((item) => ({
          menuItemId: item.id,
          name: item.name,
          score: 0.95,
          reason: `Cool down in ${weather.temperature}°F heat`,
          category: item.category,
          basePrice: item.basePrice,
          imageUrl: item.imageUrl,
        })));
      }
    }

    return recommendations.slice(0, limit);
  }

  /**
   * Get popular/trending items (for new users or cold start)
   */
  async getPopularItems(limit: number): Promise<RecommendedItem[]> {
    // Get best-selling items from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const popularQuery = await this.orderRepository
      .createQueryBuilder('order')
      .where('order.createdAt >= :date', { date: thirtyDaysAgo })
      .getMany();

    // Count item frequency
    const itemCounts = new Map<string, number>();
    popularQuery.forEach((order) => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          if (item.menuItemId) {
            const count = itemCounts.get(item.menuItemId) || 0;
            itemCounts.set(item.menuItemId, count + 1);
          }
        });
      }
    });

    // Get top items
    const sortedItems = Array.from(itemCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    const recommendations: RecommendedItem[] = [];

    for (const [itemId, count] of sortedItems) {
      const menuItem = await this.menuItemRepository.findOne({
        where: { id: itemId, isActive: true },
      });

      if (menuItem) {
        recommendations.push({
          menuItemId: menuItem.id,
          name: menuItem.name,
          score: 1.0,
          reason: 'Popular choice',
          category: menuItem.category,
          basePrice: menuItem.basePrice,
          imageUrl: menuItem.imageUrl,
        });
      }
    }

    return recommendations;
  }

  /**
   * Find items similar to a given item (by category, price, tags)
   */
  async findSimilarItems(
    itemId: string,
    limit: number,
  ): Promise<RecommendedItem[]> {
    const baseItem = await this.menuItemRepository.findOne({
      where: { id: itemId },
    });

    if (!baseItem) {
      return [];
    }

    // Get item similarity from cache
    const similarities = this.itemSimilarityCache.get(itemId);
    if (!similarities || similarities.size === 0) {
      // Fallback: Find items in same category
      const categoryItems = await this.menuItemRepository.find({
        where: {
          category: baseItem.category,
          isActive: true,
        },
        take: limit + 1, // +1 because we'll filter out the base item
      });

      return categoryItems
        .filter((item) => item.id !== itemId)
        .slice(0, limit)
        .map((item) => ({
          menuItemId: item.id,
          name: item.name,
          score: 0.7,
          reason: 'Similar item',
          category: item.category,
          basePrice: item.basePrice,
          imageUrl: item.imageUrl,
        }));
    }

    // Use cached similarities
    const recommendations: RecommendedItem[] = [];
    const sortedSimilarities = Array.from(similarities.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    for (const [similarItemId, similarity] of sortedSimilarities) {
      const menuItem = await this.menuItemRepository.findOne({
        where: { id: similarItemId, isActive: true },
      });

      if (menuItem) {
        recommendations.push({
          menuItemId: menuItem.id,
          name: menuItem.name,
          score: similarity,
          reason: 'Similar to items you like',
          category: menuItem.category,
          basePrice: menuItem.basePrice,
          imageUrl: menuItem.imageUrl,
        });
      }
    }

    return recommendations;
  }

  /**
   * Build item-item similarity matrix using collaborative filtering
   * Cosine similarity based on co-purchase patterns
   */
  async buildItemSimilarityMatrix(): Promise<void> {
    this.logger.log('Building item similarity matrix...');

    // Get all orders from last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const orders = await this.orderRepository.find({
      where: { createdAt: ninetyDaysAgo },
      order: { createdAt: 'DESC' },
      take: 10000, // Limit for performance
    });

    // Build co-occurrence matrix
    const coOccurrence = new Map<string, Map<string, number>>();

    for (const order of orders) {
      if (!order.items || !Array.isArray(order.items)) continue;

      const itemIds = order.items
        .map((item: any) => item.menuItemId)
        .filter((id) => !!id);

      // Count co-occurrences
      for (let i = 0; i < itemIds.length; i++) {
        for (let j = i + 1; j < itemIds.length; j++) {
          const item1 = itemIds[i];
          const item2 = itemIds[j];

          // Update item1 -> item2
          if (!coOccurrence.has(item1)) {
            coOccurrence.set(item1, new Map());
          }
          const item1Map = coOccurrence.get(item1)!;
          item1Map.set(item2, (item1Map.get(item2) || 0) + 1);

          // Update item2 -> item1 (symmetric)
          if (!coOccurrence.has(item2)) {
            coOccurrence.set(item2, new Map());
          }
          const item2Map = coOccurrence.get(item2)!;
          item2Map.set(item1, (item2Map.get(item1) || 0) + 1);
        }
      }
    }

    // Convert co-occurrence to similarity (normalize by frequency)
    for (const [itemId, coOccurrences] of coOccurrence.entries()) {
      const similarities = new Map<string, number>();
      const maxCoOccurrence = Math.max(...Array.from(coOccurrences.values()));

      for (const [otherItemId, count] of coOccurrences.entries()) {
        // Normalize similarity to 0-1
        similarities.set(otherItemId, count / maxCoOccurrence);
      }

      this.itemSimilarityCache.set(itemId, similarities);
    }

    this.logger.log(
      `Item similarity matrix built: ${this.itemSimilarityCache.size} items`,
    );
  }

  /**
   * Merge recommendations from multiple strategies and deduplicate
   */
  private mergeRecommendations(
    recommendations: RecommendedItem[],
  ): RecommendedItem[] {
    const merged = new Map<string, RecommendedItem>();

    for (const rec of recommendations) {
      const existing = merged.get(rec.menuItemId);
      if (existing) {
        // Combine scores (average)
        existing.score = (existing.score + rec.score) / 2;
      } else {
        merged.set(rec.menuItemId, rec);
      }
    }

    return Array.from(merged.values());
  }

  /**
   * Filter out items user purchased in last 7 days
   */
  private async filterRecentPurchases(
    userId: string,
    recommendations: RecommendedItem[],
  ): Promise<RecommendedItem[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentOrders = await this.orderRepository.find({
      where: {
        userId,
        createdAt: sevenDaysAgo,
      },
    });

    const recentItemIds = new Set<string>();
    recentOrders.forEach((order) => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          if (item.menuItemId) {
            recentItemIds.add(item.menuItemId);
          }
        });
      }
    });

    return recommendations.filter(
      (rec) => !recentItemIds.has(rec.menuItemId),
    );
  }

  /**
   * Get trending items (rapid growth in popularity)
   */
  async getTrendingItems(limit: number = 10): Promise<RecommendedItem[]> {
    // Compare last 7 days vs previous 7 days
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Get orders for both periods
    const recentOrders = await this.orderRepository.find({
      where: { createdAt: sevenDaysAgo },
    });

    const previousOrders = await this.orderRepository.find({
      where: {
        createdAt: fourteenDaysAgo,
      },
    });

    // Count items in each period
    const recentCounts = this.countItems(recentOrders);
    const previousCounts = this.countItems(previousOrders);

    // Calculate growth rates
    const growthRates = new Map<string, number>();

    for (const [itemId, recentCount] of recentCounts.entries()) {
      const previousCount = previousCounts.get(itemId) || 1; // Avoid division by zero
      const growthRate = (recentCount - previousCount) / previousCount;

      if (growthRate > 0) {
        growthRates.set(itemId, growthRate);
      }
    }

    // Sort by growth rate
    const trending = Array.from(growthRates.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    const recommendations: RecommendedItem[] = [];

    for (const [itemId, growthRate] of trending) {
      const menuItem = await this.menuItemRepository.findOne({
        where: { id: itemId, isActive: true },
      });

      if (menuItem) {
        recommendations.push({
          menuItemId: menuItem.id,
          name: menuItem.name,
          score: Math.min(growthRate, 1),
          reason: `Trending (${Math.round(growthRate * 100)}% growth)`,
          category: menuItem.category,
          basePrice: menuItem.basePrice,
          imageUrl: menuItem.imageUrl,
        });
      }
    }

    return recommendations;
  }

  /**
   * Helper: Count item occurrences in orders
   */
  private countItems(orders: Order[]): Map<string, number> {
    const counts = new Map<string, number>();

    for (const order of orders) {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          if (item.menuItemId) {
            counts.set(item.menuItemId, (counts.get(item.menuItemId) || 0) + 1);
          }
        });
      }
    }

    return counts;
  }
}
