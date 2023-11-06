import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSpaceshipDto } from './dto/create-spaceship.dto';
import { UpdateSpaceshipDto } from './dto/update-spaceship.dto';
import { SpaceshipRole, SpaceshipStatus } from '@prisma/client';

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
      include: {
        members: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });

    if (!spaceship) {
      throw new NotFoundException('우주선을 찾을 수 없습니다.');
    }

    spaceship.members = spaceship.members.map((member) => ({
      ...member,
      name: member.user.name,
      email: member.user.email,
      profileImage: member.user.profileImage,
      user: undefined,
    }));

    return spaceship;
  }

  async createSpaceship(userId: number, dto: CreateSpaceshipDto) {
    const spaceship = await this.prisma.spaceship.create({
      data: {
        ...dto,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        ownerId: userId,
      },
    });

    await this.prisma.spaceshipMember.create({
      data: {
        spaceshipId: spaceship.id,
        userId: userId,
        role: 'OWNER',
      },
    });

    return spaceship;
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
      data: {
        status: data.spaceshipStatus,
        name: data.name,
        description: data.description,
        maxMembers: data.maxMembers,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        planetId: data.planetId,
      },
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

  async updateSpaceshipStatus(
    userId: number,
    spaceshipId: number,
    status: SpaceshipStatus,
  ) {
    const spaceship = await this.getSpaceshipById(spaceshipId);

    if (spaceship.ownerId !== userId) {
      throw new ForbiddenException('우주선 상태를 변경할 권한이 없습니다.');
    }

    return this.prisma.spaceship.update({
      where: { id: spaceshipId },
      data: { status },
    });
  }

  async boardSpaceship(userId: number, spaceshipId: number) {
    const spaceship = await this.getSpaceshipById(spaceshipId);
    if (!spaceship) {
      throw new NotFoundException('우주선을 찾을 수 없습니다.');
    }
    const existingMember = await this.prisma.spaceshipMember.findFirst({
      where: {
        userId: userId,
        spaceshipId: spaceshipId,
      },
    });

    if (existingMember) {
      throw new ForbiddenException('이미 이 우주선에 탑승했습니다.');
    }
    return this.prisma.spaceshipMember.create({
      data: {
        spaceshipId: spaceshipId,
        userId: userId,
      },
    });
  }

  async leaveSpaceship(userId: number, spaceshipId: number) {
    const spaceship = await this.getSpaceshipById(spaceshipId);
    if (
      spaceship.status === SpaceshipStatus.COMPLETED ||
      spaceship.status === SpaceshipStatus.CANCELED
    ) {
      throw new ForbiddenException('이 우주선은 이미 종료되었습니다.');
    }

    const member = await this.prisma.spaceshipMember.findFirst({
      where: {
        userId: userId,
        spaceshipId: spaceshipId,
      },
    });

    if (!member) {
      throw new NotFoundException('이 우주선에 탑승한 기록이 없습니다.');
    }

    return this.prisma.spaceshipMember.delete({
      where: {
        id: member.id,
      },
    });
  }

  async transferOwnership(
    spaceshipId: number,
    currentOwnerId: number,
    newOwnerId: number,
  ) {
    return this.prisma.$transaction(async (prisma) => {
      await prisma.spaceshipMember.delete({
        where: {
          spaceshipId_userId: {
            spaceshipId: spaceshipId,
            userId: currentOwnerId,
          },
        },
      });

      await prisma.spaceshipMember.upsert({
        where: {
          spaceshipId_userId: {
            spaceshipId: spaceshipId,
            userId: newOwnerId,
          },
        },
        update: {
          role: SpaceshipRole.OWNER,
        },
        create: {
          spaceshipId: spaceshipId,
          userId: newOwnerId,
          role: SpaceshipRole.OWNER,
        },
      });

      const updatedSpaceship = await prisma.spaceship.update({
        where: { id: spaceshipId },
        data: { ownerId: newOwnerId },
      });

      return updatedSpaceship;
    });
  }
}
