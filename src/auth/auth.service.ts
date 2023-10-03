import { userRole } from './decorator/roles.decorator';
import * as bcrypt from 'bcrypt';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { UsersService } from 'src/users/users.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService, // PrismaService를 주입 받습니다.
  ) {}

  async validateUser(oauthId: string): Promise<any> {
    const user = await this.usersService.getUserByOauthId(oauthId);
    if (!user) {
      return null;
    }
    return user;
  }

  async createLoginToken(user: User) {
    const payload = {
      userId: user.id,
      userLevel: user.userLevel,
      userToken: 'loginToken',
    };

    return this.jwtService.sign(payload, {
      secret: process.env.JWT_SCRECT_KEY,
      expiresIn: '250h',
    });
  }

  async createRefreshToken(user: User) {
    const payload = {
      userId: user.id,
      userToken: 'refreshToken',
    };

    const token = await this.jwtService.sign(payload, {
      secret: process.env.JWT_SCRECT_KEY,
      expiresIn: '50m',
    });

    const refreshToken = await bcrypt.hash(token, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { userRefreshToken: refreshToken },
    });

    return refreshToken;
  }

  async signUp(userProfile: any) {
    const user = await this.usersService.createUser(userProfile);
    return user;
  }

  async tokenValidate(token: string) {
    return await this.jwtService.verify(token, {
      secret: process.env.JWT_SCRECT_KEY,
    });
  }
}
