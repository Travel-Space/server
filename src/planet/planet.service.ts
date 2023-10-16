import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlanetService {
  constructor(private readonly prisma: PrismaService) {}

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
