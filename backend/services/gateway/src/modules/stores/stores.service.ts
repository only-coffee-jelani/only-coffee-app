import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store, StoreHours } from '@shared/database/entities';
import { StoreType as StoreTypeEntity } from '@shared/database/entities/store-type.entity';
import { isStoreOpen, getFormattedStoreHours } from './store-hours.helper';
import { CreateStoreDto, UpdateStoreDto } from './dto';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    @InjectRepository(StoreTypeEntity)
    private readonly storeTypeRepository: Repository<StoreTypeEntity>,
    @InjectRepository(StoreHours)
    private readonly storeHoursRepository: Repository<StoreHours>,
  ) {}

  async findNearby(latitude: number, longitude: number, radiusMiles: number = 10) {
    // Calculate bounding box for efficient query
    // 1 degree latitude ≈ 69 miles, 1 degree longitude ≈ 69 * cos(latitude) miles
    const latRange = radiusMiles / 69;
    const lonRange = radiusMiles / (69 * Math.cos((latitude * Math.PI) / 180));

    const stores = await this.storeRepository
      .createQueryBuilder('store')
      .leftJoinAndSelect('store.storeHours', 'storeHours')
      .leftJoinAndSelect('store.storeType', 'storeType')
      .where('store.isActive = :isActive', { isActive: true })
      .andWhere('store.acceptingOrders = :acceptingOrders', { acceptingOrders: true })
      .andWhere('store.latitude BETWEEN :minLat AND :maxLat', {
        minLat: latitude - latRange,
        maxLat: latitude + latRange,
      })
      .andWhere('store.longitude BETWEEN :minLon AND :maxLon', {
        minLon: longitude - lonRange,
        maxLon: longitude + lonRange,
      })
      .getMany();

    // Calculate actual distance, add isOpen field, and filter
    return stores
      .map((store) => ({
        ...store,
        distance: this.calculateDistance(latitude, longitude, store.latitude, store.longitude),
        isOpen: isStoreOpen(store.storeHours || [], store.timezone),
        formattedHours: getFormattedStoreHours(store.storeHours || []),
      }))
      .filter((store) => store.distance <= radiusMiles)
      .sort((a, b) => a.distance - b.distance);
  }

  async findAll() {
    const stores = await this.storeRepository.find({
      relations: ['storeType', 'storeHours'],
      order: { createdAt: 'DESC' },
    });

    // Add isOpen field to each store
    return stores.map(store => ({
      ...store,
      isOpen: isStoreOpen(store.storeHours || [], store.timezone),
      formattedHours: getFormattedStoreHours(store.storeHours || []),
    }));
  }

  async getAllStoreTypes() {
    return this.storeTypeRepository.find({
      order: { code: 'ASC' as any },
    });
  }

  async findById(id: string) {
    const store = await this.storeRepository.findOne({
      where: { storeId: id },
      relations: ['storeType', 'storeHours'],
    });
    if (!store) {
      throw new NotFoundException(`Store with ID ${id} not found`);
    }
    return {
      ...store,
      isOpen: isStoreOpen(store.storeHours || [], store.timezone),
      formattedHours: getFormattedStoreHours(store.storeHours || []),
    };
  }

  async findByType(typeId: string) {
    // Query stores by storeTypeId
    const stores = await this.storeRepository.find({
      where: { storeTypeId: typeId, isActive: true },
      relations: ['storeType', 'storeHours'],
      order: { createdAt: 'DESC' },
    });

    // Add isOpen field to each store
    return stores.map(store => ({
      ...store,
      isOpen: isStoreOpen(store.storeHours || [], store.timezone),
      formattedHours: getFormattedStoreHours(store.storeHours || []),
    }));
  }

  async create(createStoreDto: CreateStoreDto) {
    // Validate storeTypeId if provided
    if (createStoreDto.storeTypeId) {
      const storeType = await this.storeTypeRepository.findOne({
        where: { storeTypeId: createStoreDto.storeTypeId },
      });
      if (!storeType) {
        throw new BadRequestException('Invalid store type ID');
      }
    }

    // Additional validation for USA stores
    if (createStoreDto.countryCode === 'US' || createStoreDto.country === 'United States') {
      if (!createStoreDto.state) {
        throw new BadRequestException('State is required for USA stores');
      }
      if (!createStoreDto.zipCode) {
        throw new BadRequestException('ZIP code is required for USA stores');
      }
    }

    const store = this.storeRepository.create({
      ...createStoreDto,
      latitude: createStoreDto.latitude || null,
      longitude: createStoreDto.longitude || null,
    });

    const savedStore = await this.storeRepository.save(store) as unknown as Store;

    // Create store hours if provided
    if (createStoreDto.storeHours && Array.isArray(createStoreDto.storeHours)) {
      const hours = createStoreDto.storeHours.map((hour) =>
        this.storeHoursRepository.create({
          store: savedStore,
          dayOfWeek: hour.dayOfWeek,
          openTime: hour.openTime,
          closeTime: hour.closeTime,
        }),
      );
      await this.storeHoursRepository.save(hours);
    }

    return this.findById(savedStore.storeId);
  }

  async update(id: string, updateStoreDto: UpdateStoreDto) {
    const store = await this.findById(id);

    // Validate storeTypeId if provided
    if (updateStoreDto.storeTypeId) {
      const storeType = await this.storeTypeRepository.findOne({
        where: { storeTypeId: updateStoreDto.storeTypeId },
      });
      if (!storeType) {
        throw new BadRequestException('Invalid store type ID');
      }
    }

    // Update store hours if provided
    if (updateStoreDto.storeHours && Array.isArray(updateStoreDto.storeHours)) {
      // Delete existing hours
      await this.storeHoursRepository.delete({ storeId: id });

      // Create new hours
      const hours = updateStoreDto.storeHours.map((hour) =>
        this.storeHoursRepository.create({
          storeId: id,
          dayOfWeek: hour.dayOfWeek,
          openTime: hour.openTime,
          closeTime: hour.closeTime,
        }),
      );
      await this.storeHoursRepository.save(hours);

      // Remove from update DTO to avoid TypeORM error
      const { storeHours, ...updateData } = updateStoreDto;
      Object.assign(store, updateData);
    } else {
      Object.assign(store, updateStoreDto);
    }

    await this.storeRepository.save(store);

    return this.findById(id);
  }

  async delete(id: string) {
    const store = await this.findById(id);
    return this.storeRepository.remove(store);
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    // Haversine formula to calculate distance between two coordinates
    const R = 3959; // Earth's radius in miles
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
