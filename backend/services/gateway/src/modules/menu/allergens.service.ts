import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Allergen } from '@shared/database/entities';

@Injectable()
export class AllergensService {
  constructor(
    @InjectRepository(Allergen)
    private readonly allergenRepository: Repository<Allergen>,
  ) {}

  async findAll() {
    const allergens = await this.allergenRepository.find({
      order: {
        sortOrder: 'ASC',
      },
    });

    return allergens.map((allergen) => ({
      id: allergen.allergenId,
      allergenId: allergen.allergenId,
      name: allergen.name,
      description: allergen.description,
      icon: allergen.icon,
      sortOrder: allergen.sortOrder,
    }));
  }

  async findByIds(allergenIds: string[]): Promise<Allergen[]> {
    if (!allergenIds || allergenIds.length === 0) {
      return [];
    }

    return this.allergenRepository
      .createQueryBuilder('allergen')
      .whereInIds(allergenIds)
      .getMany();
  }
}

