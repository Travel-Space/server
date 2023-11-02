import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { CreateUserDto } from 'src/auth/dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserById(id: number) {
    return await this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string) {
    return await this.prisma.user.findUnique({ where: { email } });
  }

  async createUser(createUserDto: CreateUserDto) {
    try {
      const user = await this.prisma.user.create({
        data: {
          ...createUserDto,
          provider: 'GOOGLE',
        },
      });
      return user;
    } catch (error) {
      throw new BadRequestException('회원 생성 중 에러가 발생했습니다.');
    }
  }

  async getAllUsers(page: number, limit: number): Promise<User[]> {
    const skip = (page - 1) * limit;
    return this.prisma.user.findMany({
      skip,
      take: limit,
    });
  }

  async deleteUserByAdmin(userId: string): Promise<void> {
    const id = parseInt(userId, 10);
    try {
      await this.prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      throw new BadRequestException('유저 삭제 중 에러가 발생했습니다.');
    }
  }

  async updateUser(userId: string, updateData: any): Promise<User> {
    const id = parseInt(userId, 10);
    try {
      return await this.prisma.user.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      throw new BadRequestException('유저 정보 수정 중 에러가 발생했습니다.');
    }
  }

  async followUser(userId: number, friendId: number) {
    if (userId === friendId) {
      throw new BadRequestException('자기 자신을 팔로우할 수 없습니다.');
    }

    const existingFriendship = await this.prisma.userFriend.findUnique({
      where: {
        userId_friendId: {
          userId,
          friendId,
        },
      },
    });

    if (existingFriendship) {
      throw new BadRequestException('이미 팔로우하고 있습니다.');
    }

    return this.prisma.userFriend.create({
      data: {
        userId,
        friendId,
      },
    });
  }

  async unfollowUser(userId: number, friendId: number) {
    return this.prisma.userFriend.delete({
      where: {
        userId_friendId: {
          userId,
          friendId,
        },
      },
    });
  }

  async getFollowing(userId: number, page: number, limit: number) {
    const skip = (page - 1) * limit;
    return this.prisma.userFriend.findMany({
      where: { userId },
      skip,
      take: limit,
      include: { friend: true },
    });
  }

  async getFollowers(userId: number, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const followers = await this.prisma.userFriend.findMany({
      where: {
        friendId: userId,
      },
      skip,
      take: limit,
      include: {
        user: true,
      },
    });

    const following = await this.prisma.userFriend.findMany({
      where: {
        userId: userId,
      },
    });
    const followingIds = following.map((f) => f.friendId);

    return followers.map((follower) => ({
      ...follower,
      isMutual: followingIds.includes(follower.userId),
    }));
  }

  async checkNicknameAvailability(nickname: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { nickName: nickname },
    });
    return !user;
  }

  async leaveAllSpaceships(userId: number): Promise<void> {
    const ownedSpaceships = await this.prisma.spaceship.findMany({
      where: { ownerId: userId },
    });

    if (ownedSpaceships.length > 0) {
      throw new BadRequestException(
        '소유하고 있는 우주선이 있습니다. 소유권을 이전하거나 우주선을 삭제하세요.',
      );
    }

    await this.prisma.spaceshipMember.deleteMany({
      where: { userId },
    });
  }

  async leaveAllPlanets(userId: number): Promise<void> {
    const ownedPlanets = await this.prisma.planet.findMany({
      where: { ownerId: userId },
    });

    if (ownedPlanets.length > 0) {
      throw new BadRequestException(
        '소유하고 있는 행성이 있습니다. 소유권을 이전하거나 행성을 삭제하세요.',
      );
    }

    await this.prisma.planetMembership.deleteMany({
      where: { userId },
    });
  }

  async deleteUser(userId: number): Promise<void> {
    const ownedSpaceships = await this.prisma.spaceship.count({
      where: { ownerId: userId },
    });

    const ownedPlanets = await this.prisma.planet.count({
      where: { ownerId: userId },
    });

    if (ownedSpaceships > 0 || ownedPlanets > 0) {
      throw new BadRequestException(
        '소유하고 있는 우주선이나 행성이 있습니다. 소유권을 이전하거나 탈퇴하세요.',
      );
    }

    const spaceshipMemberships = await this.prisma.spaceshipMember.count({
      where: { userId },
    });

    const planetMemberships = await this.prisma.planetMembership.count({
      where: { userId },
    });

    if (spaceshipMemberships > 0 || planetMemberships > 0) {
      throw new BadRequestException(
        '가입되어 있는 우주선이나 행성이 있습니다. 먼저 탈퇴하세요.',
      );
    }

    await this.prisma.article.updateMany({
      where: { authorId: userId },
      data: { authorId: null },
    });

    await this.prisma.comment.updateMany({
      where: { authorId: userId },
      data: { authorId: null },
    });

    await this.prisma.user.delete({
      where: { id: userId },
    });
  }
}
