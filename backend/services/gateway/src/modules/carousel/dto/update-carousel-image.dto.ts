import { PartialType } from '@nestjs/swagger';
import { CreateCarouselImageDto } from './create-carousel-image.dto';

export class UpdateCarouselImageDto extends PartialType(CreateCarouselImageDto) {}

