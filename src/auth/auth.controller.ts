import {
  Controller,
  Post,
  UseGuards,
  Request,
  Response,
  Body,
  Get,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto, FindAccountDto, SigninDto } from './dto';
import { GoogleAuthGuard } from './guard/google-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(GoogleAuthGuard)
  @Get('google')
  async googleAuth(@Request() req) {}

  @Get('google/redirect')
  async googleAuthRedirect(@Request() req, @Response() res) {
    const token = await this.authService.login(req, 'google');
    if (!token) {
      throw new UnauthorizedException();
    }
    res.redirect(`http://your_frontend_url?token=${token}`);
  }

  @Post('signup')
  async signup(@Body() createUserDto: CreateUserDto) {
    return this.authService.createUser(createUserDto);
  }

  @Post('signin')
  async signin(@Body() signinDto: SigninDto) {
    return this.authService.login(signinDto, 'local');
  }

  @Post('find-account')
  async findAccount(@Body() findAccountDto: FindAccountDto) {
    return this.authService.findAccount(findAccountDto);
  }
}
