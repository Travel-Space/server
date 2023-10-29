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

  async getAllUsers(): Promise<User[]> {
    return await this.prisma.user.findMany();
  }

  async deleteUser(userId: string): Promise<void> {
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

  async getFollowing(userId: number) {
    return this.prisma.userFriend.findMany({
      where: {
        userId: userId,
      },
      include: {
        friend: true,
      },
    });
  }

  async getFollowers(userId: number) {
    const followers = await this.prisma.userFriend.findMany({
      where: {
        friendId: userId,
      },
      include: {
        user: true,
      },
    });

    return Promise.all(
      followers.map(async (follower) => {
        const isMutual = await this.prisma.userFriend.findUnique({
          where: {
            userId_friendId: {
              userId: follower.userId,
              friendId: userId,
            },
          },
        });
        return {
          ...follower,
          isMutual: !!isMutual,
        };
      }),
    );
  }

  async checkNicknameAvailability(nickname: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { nickName: nickname },
    });
    return !user;
  }
}
