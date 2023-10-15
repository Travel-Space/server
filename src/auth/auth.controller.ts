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
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import {
  CreateUserDto,
  CreateUserResponse,
  EmailDto,
  VerifyCodeDto,
  LoginDto,
} from './dto';
import { SocialProvider } from '@prisma/client';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GoogleAuthGuard } from './guard/google-auth.guard';
import { JwtAuthGuard } from './guard/jwt-auth.guard';

@ApiTags('auth API')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth(@Req() req) {}

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
    return { success: true };
  }
}
