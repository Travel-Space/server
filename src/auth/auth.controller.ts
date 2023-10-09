import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  UnauthorizedException,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './guard/google-auth.guard';
import { ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
// import { NaverAuthGuard } from './guard/naver-auth.guard';
// import { KakaoAuthGuard } from './guard/kakao-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private jwtService: JwtService,
    private readonly authService: AuthService,
  ) {}

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleLogin() {}

  async googleLoginRedirect(@Req() req, @Res() res: Response) {
    const user = await this.authService.findOrCreateSocialUser(
      'GOOGLE',
      req.user,
    );

    if (user.id) {
      const jwt = this.authService.generateJwt(user);
      return res.json({ access_token: jwt, user });
    } else {
      return;
      // return res.redirect('/register/additional-info');
    }
  }

  @Post('signUp')
  @ApiOperation({
    summary: '회원가입 API',
    description: '회원가입',
  })
  @ApiResponse({
    status: 201,
    description: '회원가입 성공',
  })
  @ApiResponse({
    status: 400,
    description: '회원가입 실패',
  })
  async signup(@Body() signupDto: CreateAuthDto, @Res() res: Response) {
    const { acecessToken };
  }
}
