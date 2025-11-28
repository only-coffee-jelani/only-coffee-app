import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, IsNull } from 'typeorm';
import { CarouselItem } from '@shared/database/entities';
import { UploadService } from '../upload/upload.service';
import { CreateCarouselImageDto, UpdateCarouselImageDto, CarouselAnalyticsDto } from './dto';

@Injectable()
export class CarouselService {
  constructor(
    @InjectRepository(CarouselItem)
    private carouselItemRepository: Repository<CarouselItem>,
    private uploadService: UploadService,
  ) {}

  /**
   * Get all active carousel items
   * Returns items that are currently active based on two-level activation logic:
   * 1. Carousel must be active (carousel.is_active = true)
   * 2. Item must be active (item.is_active = true)
   * 3. Item must be within date range (start_at/end_at)
   */
  async getActive(): Promise<CarouselItem[]> {
    const now = new Date();

    return this.carouselItemRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.imageAsset', 'imageAsset')
      .leftJoinAndSelect('item.carousel', 'carousel')
      .where('carousel.isActive = :isActive', { isActive: true })
      .andWhere('item.isActive = :itemIsActive', { itemIsActive: true })
      .andWhere('(item.startAt IS NULL OR item.startAt <= :now)', { now })
      .andWhere('(item.endAt IS NULL OR item.endAt >= :now)', { now })
      .orderBy('item.sortOrder', 'ASC')
      .getMany();
  }

  /**
   * Get all carousel items (admin)
   */
  async getAll(limit: number = 50, offset: number = 0): Promise<{ data: CarouselItem[]; total: number }> {
    const [data, total] = await this.carouselItemRepository.findAndCount({
      relations: ['imageAsset', 'carousel'],
      order: {
        sortOrder: 'ASC',
        createdAt: 'DESC',
      },
      take: limit,
      skip: offset,
    });

    return { data, total };
  }

  /**
   * Get a single carousel item by ID
   */
  async findById(id: string): Promise<CarouselItem> {
    const item = await this.carouselItemRepository.findOne({
      where: { carouselItemId: id },
      relations: ['imageAsset', 'carousel'],
    });
    if (!item) {
      throw new NotFoundException(`Carousel item with ID ${id} not found`);
    }
    return item;
  }

  /**
   * Create a new carousel item
   * Default: isActive = true (items are active by default)
   */
  async create(createDto: CreateCarouselImageDto, userId: string): Promise<CarouselItem> {
    // Note: In new schema, CarouselItem doesn't have createdBy/updatedBy fields
    // Validate sortOrder is unique within the carousel
    if (createDto.sortOrder !== undefined && createDto.carouselId) {
      const existingAtPosition = await this.carouselItemRepository.findOne({
        where: {
          sortOrder: createDto.sortOrder,
          carouselId: createDto.carouselId,
        },
      });

      if (existingAtPosition) {
        throw new BadRequestException(`Sort order ${createDto.sortOrder} is already taken in this carousel`);
      }
    }

    const carouselItem = this.carouselItemRepository.create({
      carouselId: createDto.carouselId,
      imageAssetId: createDto.imageAssetId,
      title: createDto.title,
      subtitle: createDto.subtitle || null,
      deeplink: createDto.deeplink || null,
      sortOrder: createDto.sortOrder,
      isActive: createDto.isActive !== undefined ? createDto.isActive : true,
      startAt: createDto.startAt ? new Date(createDto.startAt) : null,
      endAt: createDto.endAt ? new Date(createDto.endAt) : null,
    });

    return this.carouselItemRepository.save(carouselItem);
  }

  /**
   * Update a carousel item
   */
  async update(id: string, updateDto: UpdateCarouselImageDto, userId: string): Promise<CarouselItem> {
    const item = await this.findById(id);

    // If changing sortOrder, validate it's not taken
    if (updateDto.sortOrder !== undefined && updateDto.sortOrder !== item.sortOrder) {
      const existingAtPosition = await this.carouselItemRepository.findOne({
        where: {
          sortOrder: updateDto.sortOrder,
          carouselId: item.carouselId,
        },
      });

      if (existingAtPosition && existingAtPosition.carouselItemId !== id) {
        throw new BadRequestException(`Sort order ${updateDto.sortOrder} is already taken in this carousel`);
      }
    }

    // Update fields
    if (updateDto.imageAssetId) item.imageAssetId = updateDto.imageAssetId;
    if (updateDto.title !== undefined) item.title = updateDto.title;
    if (updateDto.subtitle !== undefined) item.subtitle = updateDto.subtitle || null;
    if (updateDto.deeplink !== undefined) item.deeplink = updateDto.deeplink || null;
    if (updateDto.sortOrder !== undefined) item.sortOrder = updateDto.sortOrder;
    if (updateDto.isActive !== undefined) item.isActive = updateDto.isActive;
    if (updateDto.startAt !== undefined) item.startAt = updateDto.startAt ? new Date(updateDto.startAt) : null;
    if (updateDto.endAt !== undefined) item.endAt = updateDto.endAt ? new Date(updateDto.endAt) : null;

    return this.carouselItemRepository.save(item);
  }

  /**
   * Delete a carousel item
   */
  async delete(id: string): Promise<void> {
    const item = await this.findById(id);

    // Note: In new schema, we don't track analytics on CarouselItem
    // Delete from database (cascade will handle relations)
    await this.carouselItemRepository.remove(item);
  }

  /**
   * Record a view event for analytics
   * Note: Analytics not implemented in new CarouselItem schema
   */
  async recordView(id: string): Promise<void> {
    // Stub - analytics tracking would need to be implemented separately
    // Could use a separate analytics table or event tracking system
  }

  /**
   * Record a click event for analytics
   * Note: Analytics not implemented in new CarouselItem schema
   */
  async recordClick(id: string): Promise<void> {
    // Stub - analytics tracking would need to be implemented separately
  }

  /**
   * Record a conversion event for analytics
   * Note: Analytics not implemented in new CarouselItem schema
   */
  async recordConversion(id: string): Promise<void> {
    // Stub - analytics tracking would need to be implemented separately
  }

  /**
   * Get analytics for all carousel items
   * Note: Analytics not implemented in new CarouselItem schema
   */
  async getAnalytics(): Promise<CarouselAnalyticsDto[]> {
    const items = await this.carouselItemRepository.find({
      relations: ['imageAsset', 'carousel'],
      order: {
        sortOrder: 'ASC',
      },
    });

    // Return stub data - real analytics would need separate tracking
    return items.map(item => ({
      id: item.carouselItemId,
      title: item.title || '',
      viewCount: 0,
      clickCount: 0,
      conversionCount: 0,
      clickThroughRate: 0,
      conversionRate: 0,
      createdAt: item.createdAt,
      lastViewedAt: null,
      lastClickedAt: null,
      isActive: true, // Based on date range
    }));
  }

  /**
   * Reorder carousel items within a carousel
   */
  async reorder(itemIds: string[]): Promise<CarouselItem[]> {
    const items: CarouselItem[] = [];

    for (let i = 0; i < itemIds.length; i++) {
      const item = await this.findById(itemIds[i]);
      item.sortOrder = i;
      items.push(await this.carouselItemRepository.save(item));
    }

    return items;
  }

  /**
   * Archive expired carousel items
   * Note: In new schema, items are automatically filtered by date range
   * This method is kept for compatibility but doesn't change data
   */
  async archiveExpired(): Promise<number> {
    // In new schema, expired items are simply not returned by getActive()
    // No need to update status as there is no status field
    return 0;
  }
}

