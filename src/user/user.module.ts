import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserSuspensionService } from './user-suspension.service';

@Module({
  providers: [UserService, PrismaService, UserSuspensionService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
