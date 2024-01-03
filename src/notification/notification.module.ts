import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NotificationService } from './notification.service';
import { NotificationGateway } from './notification.gateway';
import { NotificationController } from './notification.controller';

@Module({
  imports: [PrismaModule],
  providers: [NotificationService, NotificationGateway],
  exports: [NotificationService, NotificationGateway],
  controllers: [NotificationController],
})
export class NotificationModule {}
