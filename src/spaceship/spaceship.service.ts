import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class SpaceshipService {
  constructor(private prisma: PrismaService) {}

  async createSpaceship(data: any) {
    return await this.prisma.spaceship.create({
      data,
    });
  }

  async getAllSpaceships() {
    return await this.prisma.spaceship.findMany();
  }

  async getSpaceshipById(id: number) {
    return await this.prisma.spaceship.findUnique({
      where: { id },
    });
  }

  async updateSpaceship(id: number, data: any) {
    return await this.prisma.spaceship.update({
      where: { id },
      data,
    });
  }

  async deleteSpaceship(id: number) {
    return await this.prisma.spaceship.delete({
      where: { id },
    });
  }
}
