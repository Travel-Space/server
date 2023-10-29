import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from 'src/auth/guard';

@ApiTags('유저 API')
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

  @UseGuards(JwtAuthGuard)
  @Post('follow/:friendId')
  @ApiOperation({
    summary: '다른 사용자 팔로우',
    description: '다른 사용자를 팔로우합니다.',
  })
  async follow(
    @Req() req: any,
    @Param('friendId', ParseIntPipe) friendId: number,
  ) {
    const userId = req.user.userId;
    return this.userService.followUser(userId, friendId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('unfollow/:friendId')
  @ApiOperation({
    summary: '팔로우 취소',
    description: '팔로우한 사용자를 언팔로우합니다.',
  })
  async unfollow(
    @Req() req: any,
    @Param('friendId', ParseIntPipe) friendId: number,
  ) {
    const userId = req.user.userId;
    return this.userService.unfollowUser(userId, friendId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('following')
  @ApiOperation({
    summary: '내가 팔로우하는 친구 목록 조회',
    description: '현재 사용자가 팔로우하는 친구 목록을 조회합니다.',
  })
  async getFollowing(@Req() req: any) {
    const userId = req.user.userId;
    return this.userService.getFollowing(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('followers')
  @ApiOperation({
    summary: '나를 팔로우하는 친구 목록 조회',
    description: '현재 사용자를 팔로우하는 친구 목록과 맞팔 여부를 조회합니다.',
  })
  async getFollowers(@Req() req: any) {
    const userId = req.user.userId;
    return this.userService.getFollowers(userId);
  }
}
