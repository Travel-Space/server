import { Module } from '@nestjs/common';
import { SpaceshipController } from './spaceship.controller';
import { SpaceshipService } from './spaceship.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [SpaceshipController],
  providers: [SpaceshipService, PrismaService],
})
export class SpaceshipModule {}
