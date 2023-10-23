import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto, CreateUserResponse, UpdateUserDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { SocialProvider, User } from '@prisma/client';
import * as argon from 'argon2';
import * as nodemailer from 'nodemailer';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
  private transporter;
  private verificationCodes: { [email: string]: string } = {};
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private userService: UserService,
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
    const { password, ...userData } = createUserDto;

    const existingEmail = await this.prisma.user.findUnique({
      where: { email: userData.email },
    });
    if (existingEmail) {
      throw new ConflictException('이미 존재하는 이메일입니다.');
    }

    const existingNickName = await this.prisma.user.findFirst({
      where: { nickName: userData.nickName },
    });
    if (existingNickName) {
      throw new ConflictException('이미 존재하는 닉네임입니다.');
    }

    if (!(await this.isEmailVerified(userData.email))) {
      throw new UnauthorizedException('이메일이 인증되지 않았습니다.');
    }

    try {
      const hashedPassword: string = await argon.hash(password);
      const newUser: User = await this.prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword,
          provider: SocialProvider.LOCAL,
        },
      });

      await this.deleteVerificationCode(userData.email);

      return {
        statusCode: 201,
        message: '회원가입 성공',
        user: { id: newUser.id.toString(), email: newUser.email },
      };
    } catch (error) {
      if (error.code === 'P2002') {
        if (error.meta.target.includes('email')) {
          throw new ConflictException('이미 존재하는 이메일입니다.');
        } else if (error.meta.target.includes('nickname')) {
          throw new ConflictException('이미 존재하는 닉네임입니다.');
        }
      }
      throw new BadRequestException('회원가입 실패');
    }
  }

  async updateUser(userId: number, updateData: UpdateUserDto): Promise<User> {
    const existingNickName =
      updateData.nickName &&
      (await this.prisma.user.findFirst({
        where: { nickName: updateData.nickName },
      }));

    if (existingNickName && existingNickName.id !== userId) {
      throw new ConflictException('이미 존재하는 닉네임입니다.');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
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

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    await this.prisma.verificationCode.create({
      data: {
        email: email,
        code: verificationCode,
        expiresAt: expiresAt,
        isVerified: false,
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
      await this.prisma.verificationCode.update({
        where: { email },
        data: { isVerified: true },
      });
      return true;
    }
    return false;
  }
  async isEmailVerified(email: string): Promise<boolean> {
    const verificationRecord = await this.prisma.verificationCode.findUnique({
      where: { email },
    });
    return verificationRecord && verificationRecord.isVerified;
  }

  async deleteVerificationCode(email: string): Promise<void> {
    await this.prisma.verificationCode.delete({
      where: { email },
    });
  }

  async googleLoginCallback(profile: any): Promise<any> {
    const user = await this.userService.findByEmail(profile.email);

    if (user) {
      return user;
    } else {
      throw new UnauthorizedException('추가 정보를 입력해주세요.');
    }
  }

  async registerWithGoogle(
    profile: any,
    createUserDto: CreateUserDto,
  ): Promise<User> {
    const finalUserInfo = {
      email: profile.email,
      name: profile.name,
      ...createUserDto,
    };

    const existingEmail = await this.prisma.user.findUnique({
      where: { email: finalUserInfo.email },
    });
    if (existingEmail) {
      throw new ConflictException('이미 존재하는 이메일입니다.');
    }

    const existingNickName = await this.prisma.user.findFirst({
      where: { nickName: finalUserInfo.nickName },
    });
    if (existingNickName) {
      throw new ConflictException('이미 존재하는 닉네임입니다.');
    }

    try {
      return await this.userService.createUser(finalUserInfo);
    } catch (error) {
      if (error.code === 'P2002') {
        if (error.meta.target.includes('email')) {
          throw new ConflictException('이미 존재하는 이메일입니다.');
        } else if (error.meta.target.includes('nickname')) {
          throw new ConflictException('이미 존재하는 닉네임입니다.');
        }
      }
      throw new BadRequestException('회원가입 실패');
    }
  }

  async validateToken(token: string): Promise<any> {
    try {
      const decoded = this.jwtService.verify(token);
      return decoded;
    } catch (error) {
      throw new UnauthorizedException('토큰이 유효하지 않습니다.');
    }
  }
}
