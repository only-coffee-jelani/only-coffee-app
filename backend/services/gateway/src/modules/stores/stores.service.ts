import { Injectable } from '@nestjs/common';
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

  async findById(id: string) {
    return this.storeRepository.findOne({ where: { id } });
  }

  async findByType(type: StoreType) {
    return this.storeRepository.find({
      where: { type, isActive: true, acceptingOrders: true },
    });
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
