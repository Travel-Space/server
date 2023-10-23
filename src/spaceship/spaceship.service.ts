import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSpaceshipDto } from './dto/create-spaceship.dto';
import { UpdateSpaceshipDto } from './dto/update-spaceship.dto';

@Injectable()
export class SpaceshipService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllSpaceships() {
    return this.prisma.spaceship.findMany();
  }

  async getSpaceshipsByPlanet(planetId: number) {
    return this.prisma.spaceship.findMany({
      where: {
        planetId: planetId,
      },
    });
  }

  async getSpaceshipById(spaceshipId: number) {
    const spaceship = await this.prisma.spaceship.findUnique({
      where: { id: spaceshipId },
    });

    if (!spaceship) {
      throw new NotFoundException('우주선을 찾을 수 없습니다.');
    }

    return spaceship;
  }

  async createSpaceship(userId: number, dto: CreateSpaceshipDto) {
    return this.prisma.spaceship.create({
      data: {
        ...dto,
        ownerId: userId,
      },
    });
  }

  async updateSpaceship(
    userId: number,
    spaceshipId: number,
    data: UpdateSpaceshipDto,
  ) {
    const spaceship = await this.getSpaceshipById(spaceshipId);

    if (spaceship.ownerId !== userId) {
      throw new ForbiddenException('우주선의 주인만 업데이트 할 수 있습니다.');
    }

    return this.prisma.spaceship.update({
      where: { id: spaceshipId },
      data,
    });
  }

  async deleteSpaceship(userId: number, spaceshipId: number) {
    const spaceship = await this.getSpaceshipById(spaceshipId);

    if (spaceship.ownerId !== userId) {
      throw new ForbiddenException('우주선의 주인만 삭제 할 수 있습니다.');
    }

    return this.prisma.spaceship.delete({
      where: { id: spaceshipId },
    });
  }
}
