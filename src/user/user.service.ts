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
}
