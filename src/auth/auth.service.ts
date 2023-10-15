import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto, CreateUserResponse } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { SocialProvider, User } from '@prisma/client';
import * as argon from 'argon2';
import * as nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';

dotenv.config();
@Injectable()
export class AuthService {
  private transporter;
  private verificationCodes: { [email: string]: string } = {};
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {
    this.transporter = nodemailer.createTransport({
      service: 'naver',
      host: 'smtp.naver.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.NAVER_EMAIL,
        pass: process.env.NAVER_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }
  async register(createUserDto: CreateUserDto): Promise<CreateUserResponse> {
    try {
      const isValid = await this.verifyCode(
        createUserDto.email,
        createUserDto.verificationCode,
      );

      if (!isValid) {
        throw new UnauthorizedException('Invalid verification code');
      }

      const { verificationCode, ...userData } = createUserDto;
      const hashedPassword: string = await argon.hash(userData.password);

      const newUser: User = await this.prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword,
          provider: SocialProvider.LOCAL,
        },
      });

      return {
        statusCode: 200,
        message: '회원가입 성공',
        user: { id: newUser.id.toString(), email: newUser.email },
      };
    } catch (error) {
      console.log(error);
      throw new NotFoundException('회원가입 실패');
    }
  }

  async login(req): Promise<{ access_token: string }> {
    const { email, password } = req.body;

    let user: User;
    try {
      user = await this.prisma.user.findUnique({
        where: { email: email },
      });
    } catch (error) {
      throw new BadRequestException('유효하지 않은 크레덴셜입니다.');
    }

    if (!user) {
      throw new NotFoundException('해당하는 유저를 찾을 수 없습니다.');
    }

    const isPasswordValid = await argon.verify(user.password, password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('유효하지 않은 크레덴셜입니다.');
    }

    const payload = { userId: user.id, userEmail: user.email };
    const accessToken = this.jwtService.sign(payload);

    return { access_token: accessToken };
  }

  async findOrCreateUser(userInfo): Promise<User> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: userInfo.email },
    });

    if (existingUser) {
      return existingUser;
    }
    return await this.prisma.user.create({
      data: {
        email: userInfo.email,
        name: userInfo.name,
        provider: SocialProvider.GOOGLE,
        birthDay: '00000000',
        nickName: 'UNKNOWN',
        nationality: 'UNKNOWN',
        password: '',
      },
    });
  }

  async googleLogin(req): Promise<{ access_token: string }> {
    if (!req.user) {
      throw new UnauthorizedException('해당하는 유저가 존재하지 않습니다.');
    }
    const user = req.user;
    const payload = { userId: user.id, userEmail: user.email };
    const accessToken = this.jwtService.sign(payload);

    return { access_token: accessToken };
  }

  async sendVerificationCode(email: string): Promise<void> {
    const existingCode = await this.prisma.verificationCode.findUnique({
      where: { email: email },
    });

    if (existingCode) {
      await this.prisma.verificationCode.delete({ where: { email: email } });
    }

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    this.verificationCodes[email] = verificationCode;

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    await this.prisma.verificationCode.create({
      data: {
        email: email,
        code: verificationCode,
        expiresAt: expiresAt,
      },
    });

    const mailOptions = {
      from: process.env.NAVER_EMAIL,
      to: email,
      subject: '[TravelSpace] 회원가입 인증코드입니다',
      text: `회원가입 인증코드: ${verificationCode}`,
    };

    this.transporter.sendMail(mailOptions, function (err, info) {
      if (err) {
        throw new UnauthorizedException('인증코드 전송이 실패했습니다.');
      } else {
        this.transporter.close();
      }
    });
  }

  async verifyCode(email: string, code: string): Promise<boolean> {
    const storedCode = await this.prisma.verificationCode.findUnique({
      where: { email },
    });

    if (storedCode && storedCode.code === code) {
      await this.deleteVerificationCode(email);
      return true;
    }
    return false;
  }

  async deleteVerificationCode(email: string): Promise<void> {
    await this.prisma.verificationCode.delete({
      where: { email },
    });
  }
}
