import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlanetDto } from './dto/create-planet.dto';

@Injectable()
export class PlanetService {
  constructor(private readonly prisma: PrismaService) {}

  async createPlanet(dto: CreatePlanetDto, userId: number) {
    return await this.prisma.planet.create({
      data: {
        ...dto,
        ownerId: userId,
      },
    });
  }

  async updatePlanet(
    planetId: number,
    ownerId: number,
    data: Partial<CreatePlanetDto>,
  ) {
    const planet = await this.prisma.planet.findUnique({
      where: { id: planetId },
    });

    if (!planet) {
      throw new NotFoundException('행성을 찾을 수 없습니다.');
    }
    if (planet.ownerId !== ownerId) {
      throw new ForbiddenException('행성 주인만 업데이트 할 수 있습니다.');
    }

    return this.prisma.planet.update({
      where: { id: planetId },
      data,
    });
  }

  async deletePlanet(planetId: number, ownerId: number) {
    const planet = await this.prisma.planet.findUnique({
      where: { id: planetId },
    });

    if (!planet) {
      throw new NotFoundException('행성을 찾을 수 없습니다.');
    }
    if (planet.ownerId !== ownerId) {
      throw new ForbiddenException('행성 주인만 업데이트 할 수 있습니다.');
    }

    return this.prisma.planet.delete({
      where: { id: planetId },
    });
  }

  async joinPlanet(userId: number, planetId: number): Promise<boolean> {
    const existingMembership = await this.prisma.planetMembership.findUnique({
      where: {
        planetId_userId: {
          userId: userId,
          planetId: planetId,
        },
      },
    });

    if (existingMembership) {
      throw new Error('사용자는 이미 해당 행성에 가입되어 있습니다.');
    }

    await this.prisma.planetMembership.create({
      data: {
        userId: userId,
        planetId: planetId,
        administrator: false,
      },
    });

    return true;
  }
}
