import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review, Order, Store, OrderStatus } from '@shared/database/entities';
import { CreateReviewDto, UpdateReviewDto, RespondReviewDto } from './dto';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
  ) {}

  /**
   * Create a new review
   */
  async create(userId: string, createReviewDto: CreateReviewDto) {
    const { storeId, orderId, rating, comment, images } = createReviewDto;

    // Validate store exists
    const store = await this.storeRepository.findOne({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Check if user already reviewed this store/order
    const whereCondition: any = {
      userId,
      storeId,
    };
    if (orderId) {
      whereCondition.orderId = orderId;
    }
    const existingReview = await this.reviewRepository.findOne({
      where: whereCondition,
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this store/order');
    }

    // If orderId provided, validate it's a completed order by this user
    let isVerifiedPurchase = false;
    if (orderId) {
      const order = await this.orderRepository.findOne({
        where: { id: orderId, userId },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (order.storeId !== storeId) {
        throw new BadRequestException('Order does not belong to this store');
      }

      if (order.status === OrderStatus.COMPLETED) {
        isVerifiedPurchase = true;
      }
    }

    // Create review
    const review = this.reviewRepository.create({
      userId,
      storeId,
      orderId: orderId || null,
      rating,
      comment,
      images: images || [],
      isVerifiedPurchase,
      isVisible: true,
      helpfulCount: 0,
    });

    const savedReview = await this.reviewRepository.save(review);

    this.logger.log(`Created review ${savedReview.id} for store ${storeId} by user ${userId}`);

    return savedReview;
  }

  /**
   * Get review by ID
   */
  async findById(reviewId: string) {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
      relations: ['user', 'store'],
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }

  /**
   * Get all reviews for a store
   */
  async findByStore(
    storeId: string,
    options: {
      limit?: number;
      offset?: number;
      minRating?: number;
      verifiedOnly?: boolean;
    } = {},
  ) {
    const { limit = 20, offset = 0, minRating, verifiedOnly } = options;

    const queryBuilder = this.reviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.user', 'user')
      .where('review.storeId = :storeId', { storeId })
      .andWhere('review.isVisible = :isVisible', { isVisible: true })
      .orderBy('review.createdAt', 'DESC')
      .skip(offset)
      .take(limit);

    if (minRating) {
      queryBuilder.andWhere('review.rating >= :minRating', { minRating });
    }

    if (verifiedOnly) {
      queryBuilder.andWhere('review.isVerifiedPurchase = :verifiedOnly', { verifiedOnly: true });
    }

    const [reviews, total] = await queryBuilder.getManyAndCount();

    return {
      reviews,
      total,
      limit,
      offset,
    };
  }

  /**
   * Get reviews by user
   */
  async findByUser(userId: string, limit: number = 20) {
    return this.reviewRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['store'],
    });
  }

  /**
   * Update a review
   */
  async update(userId: string, reviewId: string, updateReviewDto: UpdateReviewDto) {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Only the review author can update
    if (review.userId !== userId) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    // Update fields
    if (updateReviewDto.rating !== undefined) {
      review.rating = updateReviewDto.rating;
    }
    if (updateReviewDto.comment !== undefined) {
      review.comment = updateReviewDto.comment;
    }
    if (updateReviewDto.images !== undefined) {
      review.images = updateReviewDto.images;
    }

    const updatedReview = await this.reviewRepository.save(review);

    this.logger.log(`Updated review ${reviewId} by user ${userId}`);

    return updatedReview;
  }

  /**
   * Delete a review
   */
  async delete(userId: string, reviewId: string) {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Only the review author can delete
    if (review.userId !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    await this.reviewRepository.remove(review);

    this.logger.log(`Deleted review ${reviewId} by user ${userId}`);

    return { success: true, message: 'Review deleted successfully' };
  }

  /**
   * Mark review as helpful
   */
  async markHelpful(reviewId: string) {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    review.helpfulCount += 1;
    await this.reviewRepository.save(review);

    this.logger.log(`Marked review ${reviewId} as helpful. Count: ${review.helpfulCount}`);

    return review;
  }

  /**
   * Respond to a review (admin/business owner)
   */
  async respond(reviewId: string, respondReviewDto: RespondReviewDto, adminUserId: string) {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
      relations: ['store'],
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // TODO: Validate that adminUserId has permission to respond for this store
    // For now, we'll allow any admin to respond

    review.responseText = respondReviewDto.responseText;
    review.responseAt = new Date();

    const updatedReview = await this.reviewRepository.save(review);

    this.logger.log(`Added response to review ${reviewId} by admin ${adminUserId}`);

    return updatedReview;
  }

  /**
   * Hide a review (admin moderation)
   */
  async hide(reviewId: string, adminUserId: string) {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    review.isVisible = false;
    await this.reviewRepository.save(review);

    this.logger.log(`Hidden review ${reviewId} by admin ${adminUserId}`);

    return review;
  }

  /**
   * Show a review (admin moderation)
   */
  async show(reviewId: string, adminUserId: string) {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    review.isVisible = true;
    await this.reviewRepository.save(review);

    this.logger.log(`Made review ${reviewId} visible by admin ${adminUserId}`);

    return review;
  }

  /**
   * Get store rating statistics
   */
  async getStoreStats(storeId: string) {
    const reviews = await this.reviewRepository.find({
      where: { storeId, isVisible: true },
    });

    if (reviews.length === 0) {
      return {
        storeId,
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        verifiedPurchaseCount: 0,
      };
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    const ratingDistribution = reviews.reduce((dist, review) => {
      dist[review.rating] = (dist[review.rating] || 0) + 1;
      return dist;
    }, {} as Record<number, number>);

    const verifiedPurchaseCount = reviews.filter((r) => r.isVerifiedPurchase).length;

    return {
      storeId,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalReviews: reviews.length,
      ratingDistribution: {
        1: ratingDistribution[1] || 0,
        2: ratingDistribution[2] || 0,
        3: ratingDistribution[3] || 0,
        4: ratingDistribution[4] || 0,
        5: ratingDistribution[5] || 0,
      },
      verifiedPurchaseCount,
    };
  }
}
