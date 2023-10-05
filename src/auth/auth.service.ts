import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

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
}
