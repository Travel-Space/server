import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlanetDto } from './dto/create-planet.dto';
import { PlanetMemberRole } from '@prisma/client';
import { UpdatePlanetDto } from './dto';

@Injectable()
export class PlanetService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllPlanet(
    page: number,
    limit: number,
    name?: string,
    hashtag?: string,
    ownerNickname?: string,
    published?: string,
    user?: any,
  ) {
    const skip = (page - 1) * limit;
    const where = {};

    if (name) {
      where['name'] = {
        contains: name,
        mode: 'insensitive',
      };
    }

    if (hashtag) {
      where['hashtags'] = {
        has: hashtag,
      };
    }

    if (ownerNickname) {
      const owner = await this.prisma.user.findUnique({
        where: {
          nickName: ownerNickname,
        },
      });
      if (owner) {
        where['ownerId'] = owner.id;
      } else {
        return {
          totalCount: 0,
          totalPages: 0,
          currentPage: page,
          planets: [],
        };
      }
    }

    if (user) {
      where['OR'] = [
        { published: true },
        { members: { some: { userId: user.id } } },
      ];
    } else if (published !== 'all') {
      where['published'] = published === 'true';
    }

    const planets = await this.prisma.planet.findMany({
      where,
      skip,
      take: limit,
      include: {
        articles: true,
        owner: {
          select: { nickName: true },
        },
        planetBookMark: true,
        members: true,
        spaceships: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const totalCount = await this.prisma.planet.count({ where });

    const planetsWithMemberCount = planets.map((planet) => ({
      ...planet,
      memberCount: planet.members.length,
    }));

    return {
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      planets: planetsWithMemberCount,
    };
  }

  async getMyPlanets(userId: number, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [memberships, totalMemberships] = await Promise.all([
      this.prisma.planetMembership.findMany({
        where: {
          userId: userId,
          status: 'APPROVED',
          planet: {
            ownerId: {
              not: userId,
            },
          },
        },
        skip,
        take: limit,
        include: {
          planet: {
            include: {
              articles: true,
              owner: true,
              planetBookMark: true,
              members: true,
              spaceships: true,
            },
          },
        },
      }),
      this.prisma.planetMembership.count({
        where: {
          userId: userId,
          status: 'APPROVED',
          planet: {
            ownerId: {
              not: userId,
            },
          },
        },
      }),
    ]);

    return {
      planets: memberships.map((membership) => membership.planet),
      totalMemberships,
    };
  }

  async getMyOwnedPlanets(userId: number, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const planets = await this.prisma.planet.findMany({
      where: {
        ownerId: userId,
      },
      skip,
      take: limit,
      include: {
        articles: true,
        owner: true,
        planetBookMark: true,
        members: true,
        spaceships: true,
        viewCount: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const [totalPlanets, viewCounts] = await Promise.all([
      this.prisma.planet.count({
        where: {
          ownerId: userId,
        },
      }),
      this.prisma.viewCount.groupBy({
        by: ['planetId'],
        where: {
          planetId: {
            in: planets.map((planet) => planet.id),
          },
        },
        _sum: {
          count: true,
        },
      }),
    ]);

    const planetViewCounts = viewCounts.reduce((acc, curr) => {
      const planetId = curr.planetId;
      const count = curr._sum.count || 0;
      if (
        !planets.some(
          (planet) => planet.id === planetId && planet.articles.length > 0,
        )
      ) {
        acc[planetId] = (acc[planetId] || 0) + count;
      }
      return acc;
    }, {});

    const planetsWithViewCounts = planets.map((planet) => ({
      ...planet,
      viewCountTotal: planetViewCounts[planet.id] || 0,
    }));

    return {
      planets: planetsWithViewCounts,
      totalPlanets,
    };
  }

  async createPlanet(dto: CreatePlanetDto, userId: number) {
    const newPlanet = await this.prisma.planet.create({
      data: {
        ...dto,
        owner: {
          connect: { id: userId },
        },
      },
    });

    await this.prisma.planetMembership.create({
      data: {
        userId: userId,
        planetId: newPlanet.id,
        status: MembershipStatus.APPROVED,
        role: PlanetMemberRole.OWNER,
      },
    });

    return newPlanet;
  }

  async updatePlanet(
    planetId: number,
    userId: number,
    data: Partial<UpdatePlanetDto>,
  ) {
    const planet = await this.prisma.planet.findUnique({
      where: { id: planetId },
    });

    if (!planet) {
      throw new NotFoundException('행성을 찾을 수 없습니다.');
    }

    const membership = await this.prisma.planetMembership.findUnique({
      where: {
        planetId_userId: {
          planetId: planetId,
          userId: userId,
        },
      },
    });

    if (
      !membership ||
      (membership.role !== PlanetMemberRole.ADMIN && planet.ownerId !== userId)
    ) {
      throw new ForbiddenException(
        '관리자 또는 행성 주인만 업데이트 할 수 있습니다.',
      );
    }
    const updateData = {
      ...data,
    };

    return this.prisma.planet.update({
      where: { id: planetId },
      data: updateData,
    });
  }

  async deletePlanet(
    planetId: number,
    userId: number,
    isAdmin: boolean = false,
  ) {
    const planet = await this.prisma.planet.findUnique({
      where: { id: planetId },
    });

    if (!planet) {
      throw new NotFoundException('행성을 찾을 수 없습니다.');
    }
    if (!isAdmin && planet.ownerId !== userId) {
      throw new ForbiddenException('행성 주인만 삭제할 수 있습니다.');
    }

    return this.prisma.$transaction(async (prisma) => {
      await prisma.article.deleteMany({
        where: { planetId: planetId },
      });

      return prisma.planet.delete({
        where: { id: planetId },
      });
    });
  }

  async joinPlanet(
    userId: number,
    planetId: number,
  ): Promise<MembershipStatus> {
    const existingMembership = await this.prisma.planetMembership.findUnique({
      where: {
        planetId_userId: {
          userId: userId,
          planetId: Number(planetId),
        },
      },
    });

    if (existingMembership) {
      if (existingMembership.status === MembershipStatus.APPROVED) {
        throw new ForbiddenException('이미 행성의 회원입니다.');
      } else if (existingMembership.status === MembershipStatus.PENDING) {
        throw new ForbiddenException(
          '이미 가입 신청을 하셨습니다. 승인을 기다려주세요.',
        );
      } else {
        throw new ForbiddenException('이전의 가입 신청이 거절되었습니다.');
      }
    }

    const planet = await this.getPlanetById(planetId);

    if (!planet) {
      throw new NotFoundException('행성을 찾을 수 없습니다.');
    }

    const membershipStatus = MembershipStatus.PENDING;

    await this.prisma.planetMembership.create({
      data: {
        userId: userId,
        planetId: planetId,
        status: membershipStatus,
        role: PlanetMemberRole.GUEST,
      },
    });

    return membershipStatus;
  }

  async approveApplication(
    adminUserId: number,
    targetUserId: number,
    planetId: number,
  ): Promise<string> {
    return this.handleApplication(
      adminUserId,
      targetUserId,
      planetId,
      MembershipStatus.APPROVED,
    );
  }

  async rejectApplication(
    adminUserId: number,
    targetUserId: number,
    planetId: number,
  ): Promise<string> {
    return this.handleApplication(
      adminUserId,
      targetUserId,
      planetId,
      MembershipStatus.REJECTED,
    );
  }

  private async handleApplication(
    adminUserId: number,
    targetUserId: number,
    planetId: number,
    action: MembershipStatus,
  ): Promise<string> {
    const adminMembership = await this.prisma.planetMembership.findUnique({
      where: {
        planetId_userId: {
          planetId: planetId,
          userId: adminUserId,
        },
      },
    });

    if (
      !adminMembership ||
      (adminMembership.role !== PlanetMemberRole.ADMIN &&
        adminMembership.role !== PlanetMemberRole.OWNER)
    ) {
      throw new ForbiddenException(
        '관리자나 주인만 승인/거절을 할 수 있습니다.',
      );
    }

    const targetMembership = await this.prisma.planetMembership.findUnique({
      where: {
        planetId_userId: {
          planetId: planetId,
          userId: targetUserId,
        },
      },
    });

    if (
      !targetMembership ||
      targetMembership.status !== MembershipStatus.PENDING
    ) {
      throw new NotFoundException('유효하지 않은 가입 신청입니다.');
    }

    if (action === MembershipStatus.APPROVED) {
      await this.prisma.planetMembership.update({
        where: {
          planetId_userId: {
            planetId: planetId,
            userId: targetUserId,
          },
        },
        data: {
          status: action,
          role: PlanetMemberRole.MEMBER,
        },
      });
      return '가입 신청이 승인되었습니다.';
    } else if (action === MembershipStatus.REJECTED) {
      await this.prisma.planetMembership.update({
        where: {
          planetId_userId: {
            planetId: planetId,
            userId: targetUserId,
          },
        },
        data: { status: action },
      });
      return '가입 신청이 거절되었습니다.';
    } else {
      throw new Error('유효하지 않은 작업입니다.');
    }
  }

  async leavePlanet(userId: number, planetId: number): Promise<void> {
    const planet = await this.prisma.planet.findUnique({
      where: {
        id: planetId,
      },
      select: {
        ownerId: true,
      },
    });

    if (!planet) {
      throw new NotFoundException('해당 행성을 찾을 수 없습니다.');
    } else if (planet.ownerId === userId) {
      throw new ForbiddenException('행성의 주인은 행성을 탈출할 수 없습니다.');
    }
    const existingMembership = await this.prisma.planetMembership.findUnique({
      where: {
        planetId_userId: {
          userId: userId,
          planetId: planetId,
        },
      },
    });
    if (!existingMembership) {
      throw new NotFoundException('해당 행성에 가입되어 있지 않습니다.');
    }
    await this.prisma.planetMembership.delete({
      where: {
        planetId_userId: {
          userId: userId,
          planetId: planetId,
        },
      },
    });
  }

  async listPlanetMembers(planetId: number) {
    return await this.prisma.planetMembership.findMany({
      where: { planetId: planetId },
      include: { user: true },
    });
  }

  async updateMemberRole(
    planetId: number,
    userId: number,
    role: PlanetMemberRole,
    currentUserId: number,
  ) {
    const planet = await this.prisma.planet.findUnique({
      where: { id: planetId },
      select: { ownerId: true },
    });

    if (!planet || planet.ownerId !== currentUserId) {
      throw new ForbiddenException(
        '행성의 소유자만 멤버 권한을 수정할 수 있습니다.',
      );
    }

    if (userId === planet.ownerId) {
      throw new ForbiddenException('행성의 주인의 역할은 수정할 수 없습니다.');
    }

    await this.prisma.planetMembership.update({
      where: {
        planetId_userId: {
          planetId: planetId,
          userId: userId,
        },
      },
      data: {
        role: role,
      },
    });

    return { message: '멤버의 권한이 수정되었습니다.' };
  }

  async getPlanetById(planetId: number) {
    return await this.prisma.planet.findUnique({
      where: { id: planetId },
      include: {
        articles: true,
        owner: true,
        planetBookMark: true,
        members: true,
        spaceships: true,
      },
    });
  }

  async getMembership(userId: number, planetId: number) {
    const membership = await this.prisma.planetMembership.findUnique({
      where: {
        planetId_userId: {
          planetId: planetId,
          userId: userId,
        },
      },
      include: {
        planet: true,
      },
    });

    if (!membership) {
      throw new NotFoundException('멤버십 정보를 찾을 수 없습니다.');
    }

    return membership;
  }

  async getPendingApplications(adminUserId: number): Promise<any> {
    const adminPlanets = await this.prisma.planetMembership.findMany({
      where: {
        userId: adminUserId,
        role: PlanetMemberRole.ADMIN,
      },
      select: {
        planetId: true,
      },
    });

    const planetIds = adminPlanets.map((p) => p.planetId);

    const pendingApplications = await this.prisma.planetMembership.findMany({
      where: {
        planetId: {
          in: planetIds,
        },
        status: MembershipStatus.PENDING,
      },
      include: {
        user: true,
        planet: true,
      },
    });

    return pendingApplications;
  }
  async addBookmark(userId: number, planetId: number) {
    const existingBookmark = await this.prisma.planetBookmark.findUnique({
      where: {
        userId_planetId: {
          userId,
          planetId,
        },
      },
    });

    if (existingBookmark) {
      throw new ConflictException('이미 북마크된 행성입니다.');
    }

    return this.prisma.planetBookmark.create({
      data: {
        userId,
        planetId,
      },
    });
  }

  async removeBookmark(userId: number, planetId: number) {
    return this.prisma.planetBookmark.delete({
      where: {
        userId_planetId: {
          userId,
          planetId,
        },
      },
    });
  }

  async getBookmarkedPlanets(userId: number, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [bookmarkedPlanets, totalCount] = await Promise.all([
      this.prisma.planetBookmark.findMany({
        where: {
          userId: userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
        include: {
          planet: {
            include: {
              members: true,
            },
          },
        },
      }),
      this.prisma.planetBookmark.count({
        where: {
          userId: userId,
        },
      }),
    ]);

    const bookmarkedPlanetsWithMemberCount = bookmarkedPlanets.map(
      (bookmark) => ({
        ...bookmark.planet,
        memberCount: bookmark.planet.members.length,
        bookmarkedAt: bookmark.createdAt,
      }),
    );

    return {
      bookmarkedPlanets: bookmarkedPlanetsWithMemberCount,
      totalCount,
    };
  }

  async transferOwnership(
    planetId: number,
    newOwnerId: number,
    currentOwnerId: number,
  ): Promise<void> {
    const planet = await this.prisma.planet.findUnique({
      where: { id: planetId },
    });

    if (!planet) {
      throw new NotFoundException('해당 행성을 찾을 수 없습니다.');
    }

    if (planet.ownerId !== currentOwnerId) {
      throw new ForbiddenException('행성의 소유권을 이전할 권한이 없습니다.');
    }

    const newOwnerMembership = await this.prisma.planetMembership.findUnique({
      where: {
        planetId_userId: {
          planetId: planetId,
          userId: newOwnerId,
        },
      },
    });

    if (!newOwnerMembership) {
      throw new NotFoundException(
        '새 소유자의 멤버십 정보를 찾을 수 없습니다.',
      );
    }

    await this.prisma.$transaction(async (prisma) => {
      await prisma.planet.update({
        where: { id: planetId },
        data: { ownerId: newOwnerId },
      });

      await prisma.planetMembership.update({
        where: {
          planetId_userId: {
            planetId: planetId,
            userId: newOwnerId,
          },
        },
        data: { role: 'OWNER' },
      });

      await prisma.planetMembership.delete({
        where: {
          planetId_userId: {
            planetId: planetId,
            userId: currentOwnerId,
          },
        },
      });
    });
  }

  async getNonOwnedPlanets(userId: number, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [memberships, totalMemberships] = await Promise.all([
      this.prisma.planetMembership.findMany({
        where: {
          userId: userId,
          status: 'APPROVED',
          planet: {
            ownerId: {
              not: userId,
            },
          },
        },
        skip,
        take: limit,
        include: {
          planet: {
            include: {
              articles: true,
              owner: true,
              planetBookMark: true,
              members: true,
              spaceships: true,
            },
          },
        },
      }),
      this.prisma.planetMembership.count({
        where: {
          userId: userId,
          status: 'APPROVED',
          planet: {
            ownerId: {
              not: userId,
            },
          },
        },
      }),
    ]);

    return {
      planets: memberships.map((membership) => membership.planet),
      totalMemberships,
    };
  }
}

export enum MembershipStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}
