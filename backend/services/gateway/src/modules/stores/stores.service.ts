import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store, StoreType } from '@shared/database/entities';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
  ) {}

  async findNearby(latitude: number, longitude: number, radiusMiles: number = 10) {
    // Calculate bounding box for efficient query
    // 1 degree latitude ≈ 69 miles, 1 degree longitude ≈ 69 * cos(latitude) miles
    const latRange = radiusMiles / 69;
    const lonRange = radiusMiles / (69 * Math.cos((latitude * Math.PI) / 180));

    const stores = await this.storeRepository
      .createQueryBuilder('store')
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

    // Calculate actual distance and filter
    return stores
      .map((store) => ({
        ...store,
        distance: this.calculateDistance(latitude, longitude, store.latitude, store.longitude),
      }))
      .filter((store) => store.distance <= radiusMiles)
      .sort((a, b) => a.distance - b.distance);
  }

  async findAll() {
    return this.storeRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string) {
    const store = await this.storeRepository.findOne({ where: { storeId: id } });
    if (!store) {
      throw new NotFoundException(`Store with ID ${id} not found`);
    }
    return store;
  }

  async findByType(type: StoreType) {
    // Note: In new schema, type is a FK to store_types table
    // This needs to be updated to query by storeTypeId
    // For now, returning all active stores
    return this.storeRepository.find({
      where: { isActive: true },
    });
  }

  async create(createStoreDto: any) {
    // Validate required fields
    if (!createStoreDto.name || !createStoreDto.city) {
      throw new BadRequestException('Name and city are required');
    }

    // Note: In new schema, type is a FK to store_types table (storeTypeId)
    // Address validation removed as address structure changed in new schema

    const store = this.storeRepository.create({
      ...createStoreDto,
      // storeTypeId should be provided in createStoreDto
      latitude: createStoreDto.latitude || 0,
      longitude: createStoreDto.longitude || 0,
    });

    return this.storeRepository.save(store);
  }

  async update(id: string, updateStoreDto: any) {
    const store = await this.findById(id);

    Object.assign(store, updateStoreDto);
    return this.storeRepository.save(store);
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
