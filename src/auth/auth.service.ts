import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto, SigninDto, FindAccountDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { SocialProvider } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async login(req, provider: string): Promise<string> {
    if (!req.user) {
      throw new UnauthorizedException(`No user from ${provider}`);
    }
    const user = await this.findOrCreateUser(req.user, provider);
    const payload = { userId: user.id, userEmail: user.email };
    return this.jwtService.sign(payload);
  }

  async findOrCreateUser(userInfo, provider: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: userInfo.email },
    });

    if (existingUser) {
      return existingUser;
    }

    let mappedProvider: 'GOOGLE' | 'NAVER' | 'KAKAO' | 'LOCAL';

    switch (provider.toUpperCase()) {
      case 'LOCAL':
        mappedProvider = SocialProvider.LOCAL;
        break;
      case 'GOOGLE':
        mappedProvider = SocialProvider.GOOGLE;
        break;
      case 'KAKAO':
        mappedProvider = SocialProvider.KAKAO;
        break;
      default:
        throw new UnauthorizedException('지원하지 않는 제공자입니다.');
    }
    return await this.prisma.user.create({
      data: {
        email: userInfo.email,
        name: userInfo.name,
        provider: mappedProvider,
      },
    });
  }

  async socialLogin(req, provider: string): Promise<string> {
    if (!req.user) {
      throw new UnauthorizedException('해당하는 유저가 존재하지 않습니다.');
    }
    const payload = {
      user: req.user,
    };
    return this.jwtService.sign(payload);
  }

  async createUser(createUserDto: CreateUserDto) {
    // 사용자 생성 로직 필요
  }

  async findAccount(findAccountDto: FindAccountDto) {
    // 계정 찾기 로직 필요
  }
}
