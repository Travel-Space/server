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
} from './dto';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GoogleAuthGuard } from './guard/google-auth.guard';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import * as argon2 from 'argon2';
import { PrismaService } from 'src/prisma/prisma.service';

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

  @Post('login')
  @ApiBody({ type: LoginDto })
  @ApiOperation({
    summary: '일반 로그인 API',
    description: '이메일과 비밀번호로 로그인한다.',
  })
  @ApiResponse({
    status: 200,
    description: '로그인 성공',
    type: String,
  })
  async login(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const { access_token } = await this.authService.login(req);
    res.cookie('ACCESS_TOKEN', access_token, {
      httpOnly: true,
      // secure: true, // HTTPS
      maxAge: 3600000,
    });
    return { success: true };
  }

  @Post('google-login')
  @ApiOperation({
    summary: 'Google 로그인 API',
    description: 'Google 계정으로 로그인한다.',
  })
  @ApiResponse({
    status: 200,
    description: '로그인 성공',
    type: String,
  })
  async googleLogin(@Req() req: any): Promise<{ access_token: string }> {
    console.log('JWT Secret Key:', process.env.JWT_SECRET_KEY);

    return this.authService.googleLogin(req);
  }

  @Delete('logout')
  @UseGuards(JwtAuthGuard)
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

  @ApiOperation({
    summary: 'Google API',
    description: 'Google 인증을 시작하는 엔드포인트',
  })
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth(@Req() req) {}

  @ApiOperation({
    summary: 'Google Auth Callback',
    description: 'Google 로그인 후 콜백 처리를 위한 엔드포인트',
  })
  @ApiResponse({
    status: 200,
    description: 'Google 로그인 후 콜백 처리 성공',
    type: String,
  })
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(
    @Req() req,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { access_token } = await this.authService.googleLogin(req);
    res.cookie('ACCESS_TOKEN', access_token, {
      httpOnly: true,
      maxAge: 3600000,
    });
    // res.redirect('https://your-frontend-domain.com/success-page');
  }

  @Get('google/callback')
  @ApiOperation({
    summary: 'Google 로그인 콜백 API',
    description: 'Google 로그인 후에 콜백 처리를 합니다.',
  })
  @ApiResponse({
    status: 200,
    description: 'Google 로그인 성공',
    type: String,
  })
  async googleLoginCallback(@Req() req): Promise<any> {
    try {
      const user = await this.authService.googleLoginCallback(req.user.profile);
      console.log(req.user.profile);
      return this.authService.googleLogin(req);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw new HttpException('추가 정보를 입력해주세요.', 401);
      }
      throw error;
    }
  }

  @Post('register-with-google')
  @ApiOperation({
    summary: 'Google을 사용하여 회원가입 API',
    description: 'Google 프로필 정보와 함께 회원가입을 합니다.',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 200,
    description: 'Google을 사용한 회원가입 성공',
    type: CreateUserResponse,
  })
  async registerWithGoogle(
    @Body() createUserDto: CreateUserDto,
    @Req() req,
  ): Promise<any> {
    if (!req.user?.profile) {
      throw new HttpException('Google 사용자 정보가 필요합니다.', 400);
    }

    const profile = req.user.profile;
    return this.authService.registerWithGoogle(profile, createUserDto);
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
    await this.authService.sendVerificationCode(email);
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
}
