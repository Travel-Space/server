import { Module } from '@nestjs/common';
import { PlanetService } from './planet.service';
import { PlanetController } from './planet.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ViewCountModule } from 'src/view-count/view-count.module';

@Module({
  imports: [ViewCountModule, PrismaModule],
  providers: [PlanetService],
  controllers: [PlanetController],
})
export class PlanetModule {}
