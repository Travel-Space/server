import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  CreateUserDto,
  CreateUserGoogleDto,
  CreateUserResponse,
  UpdateUserDto,
} from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  PlanetMembership,
  SocialProvider,
  SpaceshipMember,
  User,
} from '@prisma/client';
import * as argon from 'argon2';
import * as nodemailer from 'nodemailer';
import { UserService } from 'src/user/user.service';

type UserWithMemberships = User & {
  planetsMembership?: PlanetMembership[];
  spaceshipMemberships?: SpaceshipMember[];
};

interface DecodedToken {
  userId: number;
  userEmail: string;
  role: string;
}
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
      auth: {
        user: process.env.NAVER_EMAIL,
        pass: process.env.NAVER_PASSWORD,
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

  async registerWithGoogle(
    createUserGoogleDto: CreateUserGoogleDto,
  ): Promise<CreateUserResponse> {
    const { ...userData } = createUserGoogleDto;

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

    try {
      const newUser: User = await this.prisma.user.create({
        data: {
          ...userData,
          provider: SocialProvider.GOOGLE,
        },
      });

      return {
        statusCode: 201,
        message: '회원가입 성공',
        user: { id: newUser.id.toString(), email: newUser.email },
      };
    } catch (error) {
      if (error.code === 'P2002') {
        if (error.meta.target.includes('email')) {
          throw new ConflictException('이미 존재하는 이메일입니다.');
        } else if (error.meta.target.includes('nickName')) {
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

  async login(req): Promise<{
    id: number;
    access_token: string;
    refresh_token: string;
    memberships: any;
    role: string;
    nickName: string;
  }> {
    const { email, password } = req.body;

    let user: UserWithMemberships | null;
    try {
      user = await this.prisma.user.findUnique({
        where: { email: email },
        include: {
          planetsMembership: true,
          spaceshipMemberships: true,
        },
      });
    } catch (error) {
      console.log(error);
      throw new BadRequestException('유효하지 않은 크레덴셜입니다.');
    }

    if (!user) {
      throw new NotFoundException('해당하는 유저를 찾을 수 없습니다.');
    }

    const isPasswordValid = await argon.verify(user.password, password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('유효하지 않은 크레덴셜입니다.');
    }

    const payload = { userId: user.id, userEmail: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: 'refreshTokenSecret',
      expiresIn: '7d',
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: refreshToken },
    });

    const memberships = {
      planets: user.planetsMembership.map((pm) => ({
        planetId: pm.planetId,
        role: pm.role,
      })),
      spaceships: user.spaceshipMemberships.map((sm) => ({
        spaceshipId: sm.spaceshipId,
        role: sm.role,
      })),
    };

    return {
      id: user.id,
      access_token: accessToken,
      refresh_token: refreshToken,
      memberships: memberships,
      role: user.role,
      nickName: user.nickName,
    };
  }

  async loginWithGoogle(req): Promise<{
    id: number;
    access_token: string;
    refresh_token: string;
    memberships: any;
    role: string;
    nickName: string;
  }> {
    const { email } = req.user;

    let user: UserWithMemberships | null;
    try {
      user = await this.prisma.user.findUnique({
        where: { email: email },
        include: {
          planetsMembership: true,
          spaceshipMemberships: true,
        },
      });
    } catch (error) {
      console.log(error);
      throw new BadRequestException('유효하지 않은 크레덴셜입니다.');
    }

    if (!user) {
      throw new NotFoundException('해당하는 유저를 찾을 수 없습니다.');
    }

    const payload = { userId: user.id, userEmail: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: 'refreshTokenSecret',
      expiresIn: '7d',
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: refreshToken },
    });

    const memberships = {
      planets: user.planetsMembership.map((pm) => ({
        planetId: pm.planetId,
        role: pm.role,
      })),
      spaceships: user.spaceshipMemberships.map((sm) => ({
        spaceshipId: sm.spaceshipId,
        role: sm.role,
      })),
    };

    return {
      id: user.id,
      access_token: accessToken,
      refresh_token: refreshToken,
      memberships: memberships,
      role: user.role,
      nickName: user.nickName,
    };
  }

  async refreshToken(oldRefreshToken: string): Promise<{
    id: number;
    accessToken: string;
    refreshToken: string;
    memberships: any;
    role: string;
    nickName: string;
  }> {
    const decoded = this.jwtService.decode(oldRefreshToken) as DecodedToken;
    if (!decoded || !decoded.userId) {
      throw new UnauthorizedException('리프레시 토큰이 유효하지 않습니다.');
    }

    const userId = decoded.userId;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        planetsMembership: true,
        spaceshipMemberships: true,
      },
    });

    if (!user || user.refreshToken !== oldRefreshToken) {
      throw new UnauthorizedException('리프레시 토큰이 유효하지 않습니다.');
    }

    const newRefreshToken = this.jwtService.sign(
      {
        userId: user.id,
        userEmail: user.email,
        role: user.role,
      },
      {
        secret: 'refreshTokenSecret',
        expiresIn: '7d',
      },
    );

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    const newAccessToken = this.jwtService.sign({
      userId: user.id,
      userEmail: user.email,
      role: user.role,
    });

    const memberships = {
      planets: user.planetsMembership.map((pm) => ({
        planetId: pm.planetId,
        role: pm.role,
      })),
      spaceships: user.spaceshipMemberships.map((sm) => ({
        spaceshipId: sm.spaceshipId,
        role: sm.role,
      })),
    };

    return {
      id: user.id,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      memberships: memberships,
      role: user.role,
      nickName: user.nickName,
    };
  }

  async sendVerificationCode(email: string): Promise<void> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('이미 등록된 이메일입니다.');
    }

    const existingCode = await this.prisma.verificationCode.findUnique({
      where: { email },
    });

    if (existingCode) {
      await this.prisma.verificationCode.delete({ where: { email } });
    }

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    await this.prisma.verificationCode.create({
      data: {
        email,
        code: verificationCode,
        expiresAt,
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

  async sendVerificationCodeForPasswordReset(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('등록되지 않은 이메일입니다.');
    }
    await this.prisma.verificationCode.deleteMany({ where: { email } });

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    await this.prisma.verificationCode.create({
      data: {
        email,
        code: verificationCode,
        expiresAt,
        isVerified: false,
      },
    });

    const mailOptions = {
      from: process.env.NAVER_EMAIL,
      to: email,
      subject: '[TravelSpace] 비밀번호 변경 인증코드입니다',
      text: `비밀번호 변경 인증코드: ${verificationCode}`,
    };

    this.transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.log('인증코드 전송 에러' + err);
        throw new InternalServerErrorException('인증코드 전송에 실패했습니다.');
      }
      this.transporter.close();
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

  async validateToken(token: string): Promise<any> {
    try {
      const decoded = this.jwtService.verify(token);
      return decoded;
    } catch (error) {
      throw new UnauthorizedException('토큰이 유효하지 않습니다.');
    }
  }

  async findUserByEmail(email: string): Promise<User> {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }
}
