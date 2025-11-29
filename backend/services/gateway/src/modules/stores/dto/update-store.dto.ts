import { PartialType } from '@nestjs/swagger';
import { CreateStoreDto } from './create-store.dto';

/**
 * DTO for updating an existing store
 * 
 * All fields from CreateStoreDto are optional for updates.
 * Validation rules from CreateStoreDto still apply when fields are provided.
 */
export class UpdateStoreDto extends PartialType(CreateStoreDto) {}

