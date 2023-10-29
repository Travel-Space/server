import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from 'src/auth/guard';

ApiTags('유저 API');
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get()
  async getAllUsers() {
    return await this.userService.getAllUsers();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':userId')
  @ApiOperation({ summary: '유저 정보 삭제하기' })
  async deleteUser(@Param('userId') userId: string) {
    return await this.userService.deleteUser(userId);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put(':userId')
  @ApiOperation({ summary: '유저 정보 수정하기' })
  async updateUser(@Param('userId') userId: string, @Body() updateData: any) {
    return await this.userService.updateUser(userId, updateData);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() req: any) {
    return await this.userService.getUserById(req.user.userId);
  }
}
