import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { SocialProvider, User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateOAuthLogin(profile): Promise<User> {
    const { name, emails } = profile;
    if (!emails || emails.length === 0) {
      throw new InternalServerErrorException('이메일이 존재하지 않습니다.');
    }
    let user;

    try {
      user = await this.prisma.user.findUnique({
        where: { email: emails[0].value },
      });

      if (!user) {
        user = await this.prisma.user.create({
          data: {
            name: `${name.givenName} ${name.familyName}`,
            email: emails[0].value,
            provider: 'GOOGLE',
          },
        });
      }
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        '사용자를 검증하거나 만드는 중에 에러가 발생했습니다.',
      );
    }

    return user;
  }

  async findOrCreateSocialUser(
    provider: SocialProvider,
    socialUser: any,
  ): Promise<User> {
    let user = await this.usersService.findBySocialId(provider, socialUser.id);

    if (!user) {
      user = await this.usersService.createSocialUser(provider, socialUser);
    }
    return user;
  }

  generateJwt(user: User): string {
    const payload = { username: user.email, sub: user.id };
    return this.jwtService.sign(payload);
  }
}
