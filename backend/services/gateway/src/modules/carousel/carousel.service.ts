import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CarouselImage, CarouselImageStatus } from '@shared/database/entities';
import { UploadService } from '../upload/upload.service';
import { CreateCarouselImageDto, UpdateCarouselImageDto, CarouselAnalyticsDto } from './dto';

@Injectable()
export class CarouselService {
  constructor(
    @InjectRepository(CarouselImage)
    private carouselRepository: Repository<CarouselImage>,
    private uploadService: UploadService,
  ) {}

  /**
   * Get all active carousel images
   */
  async getActive(): Promise<CarouselImage[]> {
    return this.carouselRepository.find({
      where: {
        isActive: true,
        status: CarouselImageStatus.ACTIVE,
      },
      order: {
        position: 'ASC',
      },
    });
  }

  /**
   * Get all carousel images (admin)
   */
  async getAll(limit: number = 50, offset: number = 0): Promise<{ data: CarouselImage[]; total: number }> {
    const [data, total] = await this.carouselRepository.findAndCount({
      order: {
        position: 'ASC',
        createdAt: 'DESC',
      },
      take: limit,
      skip: offset,
    });

    return { data, total };
  }

  /**
   * Get a single carousel image by ID
   */
  async findById(id: string): Promise<CarouselImage> {
    const image = await this.carouselRepository.findOne({ where: { id } });
    if (!image) {
      throw new NotFoundException(`Carousel image with ID ${id} not found`);
    }
    return image;
  }

  /**
   * Create a new carousel image
   * Maximum 5 active images allowed
   */
  async create(createDto: CreateCarouselImageDto, userId: string): Promise<CarouselImage> {
    // Check if we already have 5 active images
    const activeCount = await this.carouselRepository.count({
      where: {
        isActive: true,
        status: CarouselImageStatus.ACTIVE,
      },
    });

    if (activeCount >= 5) {
      throw new BadRequestException('Maximum 5 active carousel images allowed. Please deactivate an existing image first.');
    }

    // Validate position is unique among active images
    if (createDto.position !== undefined) {
      const existingAtPosition = await this.carouselRepository.findOne({
        where: {
          position: createDto.position,
          isActive: true,
        },
      });

      if (existingAtPosition) {
        throw new BadRequestException(`Position ${createDto.position} is already taken by an active image`);
      }
    }

    const carouselImage = this.carouselRepository.create({
      ...createDto,
      createdBy: userId,
      updatedBy: userId,
      status: CarouselImageStatus.ACTIVE,
    });

    return this.carouselRepository.save(carouselImage);
  }

  /**
   * Update a carousel image
   */
  async update(id: string, updateDto: UpdateCarouselImageDto, userId: string): Promise<CarouselImage> {
    const image = await this.findById(id);

    // If changing position, validate it's not taken
    if (updateDto.position !== undefined && updateDto.position !== image.position) {
      const existingAtPosition = await this.carouselRepository.findOne({
        where: {
          position: updateDto.position,
          isActive: true,
          id: { $ne: id } as any,
        },
      });

      if (existingAtPosition) {
        throw new BadRequestException(`Position ${updateDto.position} is already taken by an active image`);
      }
    }

    // If deactivating, check if it's the last active image
    if (updateDto.isActive === false && image.isActive) {
      const activeCount = await this.carouselRepository.count({
        where: {
          isActive: true,
          status: CarouselImageStatus.ACTIVE,
        },
      });

      if (activeCount <= 1) {
        throw new BadRequestException('Cannot deactivate the last active carousel image');
      }
    }

    Object.assign(image, updateDto, { updatedBy: userId });
    return this.carouselRepository.save(image);
  }

  /**
   * Delete a carousel image and remove from S3
   */
  async delete(id: string): Promise<void> {
    const image = await this.findById(id);

    // Check if it's the last active image
    if (image.isActive) {
      const activeCount = await this.carouselRepository.count({
        where: {
          isActive: true,
          status: CarouselImageStatus.ACTIVE,
        },
      });

      if (activeCount <= 1) {
        throw new BadRequestException('Cannot delete the last active carousel image');
      }
    }

    // Delete from S3
    try {
      await this.uploadService.deleteImage(image.imageUrl);
    } catch (error) {
      console.error('Error deleting image from S3:', error);
      // Continue with database deletion even if S3 deletion fails
    }

    // Delete from database
    await this.carouselRepository.remove(image);
  }

  /**
   * Record a view event for analytics
   */
  async recordView(id: string): Promise<void> {
    const image = await this.findById(id);
    image.viewCount = (image.viewCount || 0) + 1;
    image.lastViewedAt = new Date();
    await this.carouselRepository.save(image);
  }

  /**
   * Record a click event for analytics
   */
  async recordClick(id: string): Promise<void> {
    const image = await this.findById(id);
    image.clickCount = (image.clickCount || 0) + 1;
    image.lastClickedAt = new Date();
    await this.carouselRepository.save(image);
  }

  /**
   * Record a conversion event for analytics
   */
  async recordConversion(id: string): Promise<void> {
    const image = await this.findById(id);
    image.conversionCount = (image.conversionCount || 0) + 1;
    await this.carouselRepository.save(image);
  }

  /**
   * Get analytics for all carousel images
   */
  async getAnalytics(): Promise<CarouselAnalyticsDto[]> {
    const images = await this.carouselRepository.find({
      order: {
        viewCount: 'DESC',
      },
    });

    return images.map(image => ({
      id: image.id,
      title: image.title,
      viewCount: image.viewCount || 0,
      clickCount: image.clickCount || 0,
      conversionCount: image.conversionCount || 0,
      clickThroughRate: image.viewCount ? ((image.clickCount || 0) / image.viewCount) * 100 : 0,
      conversionRate: image.clickCount ? ((image.conversionCount || 0) / image.clickCount) * 100 : 0,
      createdAt: image.createdAt,
      lastViewedAt: image.lastViewedAt,
      lastClickedAt: image.lastClickedAt,
      isActive: image.isActive,
    }));
  }

  /**
   * Reorder carousel images
   */
  async reorder(imageIds: string[]): Promise<CarouselImage[]> {
    if (imageIds.length > 5) {
      throw new BadRequestException('Maximum 5 carousel images allowed');
    }

    const images: CarouselImage[] = [];

    for (let i = 0; i < imageIds.length; i++) {
      const image = await this.findById(imageIds[i]);
      image.position = i;
      images.push(await this.carouselRepository.save(image));
    }

    return images;
  }

  /**
   * Archive old carousel images
   */
  async archiveExpired(): Promise<number> {
    const now = new Date();
    const result = await this.carouselRepository.update(
      {
        endDate: { $lt: now } as any,
        status: CarouselImageStatus.ACTIVE,
      },
      {
        status: CarouselImageStatus.ARCHIVED,
        isActive: false,
      },
    );

    return result.affected || 0;
  }
}

