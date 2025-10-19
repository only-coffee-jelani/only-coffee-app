import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SplashScreen } from '@shared/database/entities';
import { SplashScreenController } from './splash-screen.controller';
import { SplashScreenService } from './splash-screen.service';

@Module({
  imports: [TypeOrmModule.forFeature([SplashScreen])],
  controllers: [SplashScreenController],
  providers: [SplashScreenService],
  exports: [SplashScreenService],
})
export class SplashScreenModule {}

