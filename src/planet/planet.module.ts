import { Module } from '@nestjs/common';
import { PlanetService } from './planet.service';
import { PlanetController } from './planet.controller';

@Module({
  providers: [PlanetService],
  controllers: [PlanetController]
})
export class PlanetModule {}
