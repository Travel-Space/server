import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private jwtService: JwtService) {}
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {}

  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  googleLoginRedirect(@Req() req) {
    const payload = { username: req.user.email, sub: req.user.id };
    const jwt = this.jwtService.sign(payload);

    return {
      access_token: jwt,
      user: req.user,
    };
  }
}
