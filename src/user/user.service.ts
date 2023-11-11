import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { CreateUserDto } from 'src/auth/dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { SuspendUserDto } from './dto';
import { NotificationGateway } from 'src/notification/notification.gateway';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private notificationGateway: NotificationGateway,
  ) {}

  async getUserById(id: number) {
    return await this.prisma.user.findUnique({ where: { id } });
  }

  async getUserByOtherId(currentUserId: number, userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        friendedBy: {
          where: {
            userId: currentUserId,
          },
          select: {
            userId: true,
          },
        },
      },
    });

    const isFollowing = user.friendedBy.some(
      (friend) => friend.userId === currentUserId,
    );

    return {
      ...user,
      isFollowing,
    };
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

  async getAllUsers({
    page,
    limit,
    name,
    nickname,
    email,
    isSuspended,
  }: {
    page: number;
    limit: number;
    name?: string;
    nickname?: string;
    email?: string;
    isSuspended?: boolean;
  }) {
    const whereClause: any = {
      AND: [
        name ? { name: { contains: name } } : {},
        nickname ? { nickName: { contains: nickname } } : {},
        email ? { email: { contains: email } } : {},
      ],
    };

    if (isSuspended !== undefined) {
      const suspensionFilter = isSuspended
        ? {
            userSuspensionDate: {
              gt: new Date(),
            },
          }
        : {
            OR: [
              { userSuspensionDate: null },
              { userSuspensionDate: { lt: new Date() } },
            ],
          };
      whereClause.AND.push(suspensionFilter);
    }

    const users = await this.prisma.user.findMany({
      where: whereClause,
      take: limit,
      skip: (page - 1) * limit,
    });

    const total = await this.prisma.user.count({
      where: whereClause,
    });

    return {
      users,
      total,
    };
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

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    const newFriendship = await this.prisma.userFriend.create({
      data: {
        userId,
        friendId,
      },
    });

    const content = `${user.nickName}님이 회원님을 팔로우 했어요.`;
    const notification = await this.prisma.notification.create({
      data: {
        userId: friendId,
        content,
        userNickName: user.nickName,
      },
    });

    this.notificationGateway.sendNotificationToUser(friendId, notification.id);

    return newFriendship;
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

  async getFollowing(
    currentUserId: number,
    userId: number,
    page: number,
    limit: number,
    nickname?: string,
    email?: string,
  ) {
    const skip = (page - 1) * limit;

    const whereClauseForSearch: any = {
      userId,
      friend: {},
    };

    const whereClauseForTotal: any = {
      userId,
    };

    if (nickname) {
      whereClauseForSearch.friend.nickName = { contains: nickname };
    }

    if (email) {
      whereClauseForSearch.friend.email = { contains: email };
    }

    const friends = await this.prisma.userFriend.findMany({
      where: whereClauseForSearch,
      skip,
      take: limit,
      include: { friend: true },
    });

    let friendsWithFollowing;
    if (currentUserId === userId) {
      friendsWithFollowing = friends.map((userFriend) => ({
        ...userFriend,
        isFollowing: true,
      }));
    } else {
      friendsWithFollowing = await Promise.all(
        friends.map(async (userFriend) => {
          const isFollowing =
            (await this.prisma.userFriend.count({
              where: {
                userId: currentUserId,
                friendId: userFriend.friendId,
              },
            })) > 0;
          return {
            ...userFriend,
            isFollowing,
          };
        }),
      );
    }

    const total = await this.prisma.userFriend.count({
      where: whereClauseForTotal,
    });

    return {
      friends: friendsWithFollowing,
      total,
    };
  }

  async getFollowers(
    currentUserId: number,
    userId: number,
    page: number,
    limit: number,
    nickname?: string,
    email?: string,
  ) {
    const skip = (page - 1) * limit;

    const whereClauseForSearch: any = {
      friendId: userId,
      friend: {},
    };

    const whereClauseForTotal: any = {
      friendId: userId,
    };

    if (nickname) {
      whereClauseForSearch.friend.nickname = { contains: nickname };
    }

    if (email) {
      whereClauseForSearch.friend.email = { contains: email };
    }

    const followers = await this.prisma.userFriend.findMany({
      where: whereClauseForSearch,
      skip,
      take: limit,
      include: { user: true },
    });

    let followersWithMutual;
    if (currentUserId === userId) {
      followersWithMutual = followers.map((userFriend) => ({
        ...userFriend,
        isMutual: true,
      }));
    } else {
      const _following = await this.prisma.userFriend.findMany({
        where: {
          userId: currentUserId,
        },
      });

      const followingIds = _following.map((f) => f.friendId);

      followersWithMutual = followers.map((follower) => ({
        ...follower,
        isMutual: followingIds.includes(follower.userId),
      }));
    }

    const total = await this.prisma.userFriend.count({
      where: whereClauseForTotal,
    });

    return {
      followersWithMutual,
      total,
    };
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

  async getRandomUsers(limit: number, excludeUserId: number): Promise<User[]> {
    const followedUserIds = await this.prisma.userFriend.findMany({
      where: {
        userId: excludeUserId,
      },
      select: {
        friendId: true,
      },
    });

    const followedIds = followedUserIds.map((f) => f.friendId);

    followedIds.push(excludeUserId);

    const users = await this.prisma.user.findMany({
      where: {
        id: {
          notIn: followedIds,
        },
      },
      take: limit,
    });

    return users;
  }

  async suspendUser(userId: number, suspendUserDto: SuspendUserDto) {
    let suspensionDate;
    let isCurrentlySuspended = false;

    if (suspendUserDto.suspensionEndDate) {
      suspensionDate = new Date(suspendUserDto.suspensionEndDate);
      if (isNaN(suspensionDate.getTime())) {
        throw new BadRequestException('유효하지 않은 날짜입니다.');
      }

      isCurrentlySuspended = suspensionDate > new Date();
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isSuspended: isCurrentlySuspended,
        userSuspensionDate: suspensionDate || null,
        suspensionReason: isCurrentlySuspended
          ? suspendUserDto.suspensionReason
          : null,
      },
    });

    if (isCurrentlySuspended) {
      const content = `${updatedUser.nickName} 님의 활동 내용이 아래와 같은 사유로 해당 계정에 ${suspendUserDto.suspensionEndDate}까지 회원 정보 수정 및 회원 탈퇴를 제외한 활동 제한 조치가 이루어졌습니다. 
      사유 : ${updatedUser.suspensionReason} `;
      const notification = await this.prisma.notification.create({
        data: {
          userId: userId,
          content,
        },
      });

      this.notificationGateway.sendNotificationToUser(userId, notification.id);
    }

    return updatedUser;
  }
}
