import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserSuspensionService } from './user-suspension.service';
import { NotificationService } from 'src/notification/notification.service';
import { NotificationGateway } from 'src/notification/notification.gateway';

@Module({
  providers: [
    UserService,
    PrismaService,
    UserSuspensionService,
    NotificationService,
    NotificationGateway,
  ],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
