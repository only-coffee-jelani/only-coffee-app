import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { AllergensService } from './allergens.service';

@ApiTags('allergens')
@Controller('allergens')
export class AllergensController {
  constructor(private readonly allergensService: AllergensService) {}

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Get all allergens',
    description: 'Retrieve all allergen types available in the system',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all allergens',
    schema: {
      example: [
        {
          id: 'uuid',
          name: 'Gluten',
          description: 'Contains gluten from wheat, barley, rye, or oats',
          icon: '🌾',
          sortOrder: 1,
        },
      ],
    },
  })
  async findAll() {
    return this.allergensService.findAll();
  }
}

