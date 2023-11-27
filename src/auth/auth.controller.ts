import {
  Controller,
  Post,
  Body,
  Req,
  UnauthorizedException,
  Res,
  HttpCode,
  Delete,
  Get,
  Logger,
  UseGuards,
  BadRequestException,
  HttpException,
  Put,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import {
  CreateUserDto,
  CreateUserResponse,
  EmailDto,
  VerifyCodeDto,
  LoginDto,
  ChangePasswordDto,
  UpdateUserDto,
  CreateUserGoogleDto,
} from './dto';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import * as argon2 from 'argon2';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from '@prisma/client';
import { LoggedInGuard } from './guard';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('auth API')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prismaService: PrismaService,
  ) {}

  @HttpCode(201)
  @Post('register')
  @ApiOperation({
    summary: '회원가입 API',
    description: '회원가입을 진행한다.',
  })
  @ApiResponse({
    status: 201,
    description: '회원가입 성공',
    type: CreateUserResponse,
  })
  @ApiBody({ type: CreateUserDto })
  async register(
    @Body() createUserDto: CreateUserDto,
  ): Promise<CreateUserResponse> {
    const isEmailVerified = await this.authService.isEmailVerified(
      createUserDto.email,
    );

    if (!isEmailVerified) {
      throw new UnauthorizedException('이메일이 인증되지 않았습니다.');
    }

    const response = await this.authService.register(createUserDto);
    return response;
  }

  @HttpCode(201)
  @Post('register/google')
  @ApiOperation({
    summary: '구글 계정으로 회원가입 API',
    description: '구글 계정으로 회원가입을 진행한다.',
  })
  @ApiResponse({
    status: 201,
    description: '회원가입 성공',
    type: CreateUserResponse,
  })
  @ApiBody({ type: CreateUserGoogleDto })
  async registerWithGoogle(
    @Body() createUserGoogleDto: CreateUserGoogleDto,
  ): Promise<CreateUserResponse> {
    const response =
      await this.authService.registerWithGoogle(createUserGoogleDto);
    return response;
  }

  @Post('login')
  @ApiBody({ type: LoginDto })
  @ApiOperation({
    summary: '일반 로그인 API',
    description: '이메일과 비밀번호로 로그인한다.',
  })
  @ApiResponse({
    status: 200,
    description: '로그인 성공',
  })
  async login(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const { id, access_token, refresh_token, memberships, role, nickName } =
      await this.authService.login(req);

    res.cookie('ACCESS_TOKEN', access_token, {
      httpOnly: true,
      maxAge: 3600000,
    });

    res.cookie('REFRESH_TOKEN', refresh_token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { success: true, id, memberships, role, nickName };
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: '리프레시 토큰으로 토큰 재발급 API',
    description: '리프레시 토큰으로 액세스 토큰을 재발급한다.',
  })
  @ApiResponse({
    status: 200,
    description: '토큰 발급 성공',
  })
  async refresh(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const oldRefreshToken = req.cookies['REFRESH_TOKEN'];
    if (!oldRefreshToken) {
      throw new UnauthorizedException('리프레시 토큰이 제공되지 않았습니다.');
    }

    const { accessToken, refreshToken, id, nickName, memberships, role } =
      await this.authService.refreshToken(oldRefreshToken);

    res.cookie('ACCESS_TOKEN', accessToken, {
      httpOnly: true,
      maxAge: 3600000,
    });

    res.cookie('REFRESH_TOKEN', refreshToken, {
      httpOnly: true,
      maxAge: 604800000,
    });

    return {
      success: true,
      id: id,
      access_token: accessToken,
      refresh_token: refreshToken,
      nickName: nickName,
      memberships: memberships,
      role: role,
    };
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {}

  @Get('google/redirect')
  @ApiOperation({
    summary: '구글 로그인 API',
    description:
      '구글 로그인 후 사용자 데이터 처리 및 프론트엔드로 리디렉트한다.',
  })
  @UseGuards(AuthGuard('google'))
  async googleLoginRedirect(@Req() req, @Res() res) {
    const { email, name } = req.user;
    const user = await this.authService.findUserByEmail(email);
    if (user) {
      const { id, access_token, refresh_token, memberships, role, nickName } =
        await this.authService.loginWithGoogle(req);
      console.log('Login with Google: ', { id, memberships, role, nickName });
      res.cookie('ACCESS_TOKEN', access_token, {
        httpOnly: true,
        maxAge: 3600000,
      });
      res.cookie('REFRESH_TOKEN', refresh_token, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      const membershipsString = encodeURIComponent(JSON.stringify(memberships));
      res.redirect(
        `https://travelspace.world/login-success?id=${id}&role=${role}&nickName=${nickName}&memberships=${membershipsString}`,
      );
    } else {
      res.redirect(
        `https://travelspace.world/signup?email=${email}&name=${name}`,
      );
    }
  }

  @Delete('logout')
  @UseGuards(JwtAuthGuard, LoggedInGuard)
  @ApiOperation({
    summary: '로그아웃 API',
    description: '사용자 로그아웃 처리.',
  })
  @ApiResponse({
    status: 200,
    description: '로그아웃 성공',
  })
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('ACCESS_TOKEN');
    return { success: true };
  }

  @ApiOperation({
    summary: '회원가입 검증 코드 전송 API',
    description: '유저의 이메일로 검증 코드를 전송한다.',
  })
  @ApiBody({ type: EmailDto })
  @Post('send-verification-code')
  async sendVerificationCode(@Body('email') email: string) {
    await this.authService.sendVerificationCode(email);
    return { success: true };
  }

  @ApiBody({ type: VerifyCodeDto })
  @Post('verify-code')
  async verifyCode(@Body() verifyDto: VerifyCodeDto) {
    const isVerified = await this.authService.verifyCode(
      verifyDto.email,
      verifyDto.code,
    );
    if (!isVerified) {
      throw new UnauthorizedException('유효하지 않은 인증코드입니다.');
    }
    return { success: true };
  }

  @ApiBody({ type: EmailDto })
  @ApiOperation({
    summary: '비밀번호 변경 요청 API',
    description: '비밀번호 변경을 위한 인증 코드 요청을 보낸다.',
  })
  @ApiResponse({
    status: 200,
    description: '인증코드 전송 성공',
    type: String,
  })
  @Post('password-change/request')
  async requestPasswordChange(@Body('email') email: string) {
    await this.authService.sendVerificationCodeForPasswordReset(email);
    return { success: true, message: '인증코드가 전송되었습니다.' };
  }

  @ApiOperation({
    summary: '비밀번호 변경 인증 코드 검증 API',
    description: '비밀번호 변경을 위한 인증 코드를 검증한다.',
  })
  @ApiResponse({
    status: 200,
    description: '인증코드 검증 성공',
    type: String,
  })
  @ApiBody({ type: VerifyCodeDto })
  @Post('passwordChange/verify')
  async verifyChangeCode(@Body() verifyDto: VerifyCodeDto) {
    const isVerified = await this.authService.verifyCode(
      verifyDto.email,
      verifyDto.code,
    );
    if (!isVerified) {
      throw new UnauthorizedException('유효하지 않은 인증코드입니다.');
    }
    return {
      success: true,
      message: '인증에 성공했습니다. 비밀번호를 재설정하세요.',
    };
  }

  @ApiOperation({
    summary: '비밀번호 변경 API',
    description: '비밀번호를 변경한다.',
  })
  @ApiResponse({
    status: 200,
    description: '비밀번호 변경 성공',
    type: String,
  })
  @ApiBody({ type: ChangePasswordDto })
  @Post('passwordChange')
  async changePassword(@Body() changePasswordDto: ChangePasswordDto) {
    const { email, password } = changePasswordDto;

    if (!password) {
      throw new BadRequestException('유효하지 않은 비밀번호입니다.');
    }
    const hashedPassword = await argon2.hash(password);
    await this.prismaService.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    return { success: true, message: '비밀번호가 성공적으로 변경되었습니다.' };
  }

  @Put('update')
  @UseGuards(JwtAuthGuard, LoggedInGuard)
  @ApiOperation({
    summary: '회원 정보 수정 API',
    description: '회원 정보를 수정한다.',
  })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: '회원 정보 수정 성공',
  })
  async updateUserInfo(
    @Req() req: any,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    const userId = req.user.userId;
    return this.authService.updateUser(userId, updateUserDto);
  }
}
