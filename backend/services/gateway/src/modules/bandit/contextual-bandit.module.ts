import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Promotion } from '@shared/database/entities';
import { ContextualBanditService } from './contextual-bandit.service';
import { ContextualBanditController } from './contextual-bandit.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Promotion])],
  controllers: [ContextualBanditController],
  providers: [ContextualBanditService],
  exports: [ContextualBanditService],
})
export class ContextualBanditModule {}
