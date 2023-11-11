import { Module } from '@nestjs/common';
import { PlanetService } from './planet.service';
import { PlanetController } from './planet.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ViewCountModule } from 'src/view-count/view-count.module';
import { NotificationService } from 'src/notification/notification.service';
import { NotificationGateway } from 'src/notification/notification.gateway';

@Module({
  imports: [ViewCountModule, PrismaModule],
  providers: [PlanetService, NotificationService, NotificationGateway],
  controllers: [PlanetController],
})
export class PlanetModule {}
