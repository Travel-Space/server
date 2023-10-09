import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { SocialProvider, User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }

  async findAll() {
    return this.prisma.user.findMany();
  }

  async findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  async remove(id: number) {
    return `This action removes a #${id} user`;
  }

  async findBySocialId(
    provider: SocialProvider,
    socialId: string,
  ): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        oauthId: socialId,
        provider: provider,
      },
    });
  }

  async createSocialUser(
    provider: SocialProvider,
    userData: any,
  ): Promise<User> {
    const { email, name, oauthId } = userData;

    return this.prisma.user.create({
      data: {
        email: email,
        name: name,
        oauthId: oauthId,
        provider: provider,
      },
    });
  }
}
