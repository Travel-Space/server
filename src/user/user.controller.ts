import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { AdminGuard, LoggedInGuard } from 'src/auth/guard';

@ApiTags('유저 API')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get()
  @ApiOperation({
    summary: '모든 사용자 조회 API',
    description: '모든 사용자를 페이지네이션하여 반환합니다.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: 'number',
    description: '페이지 번호',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    description: '한 페이지당 행성 수',
  })
  async getAllUsers(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return this.userService.getAllUsers(page, limit);
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

  @UseGuards(JwtAuthGuard, LoggedInGuard)
  @Get('profile')
  async getProfile(@Req() req: any) {
    return await this.userService.getUserById(req.user.userId);
  }

  @UseGuards(JwtAuthGuard, LoggedInGuard)
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

  @UseGuards(JwtAuthGuard, LoggedInGuard)
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

  @UseGuards(JwtAuthGuard, LoggedInGuard)
  @Get('following')
  @ApiOperation({
    summary: '내가 팔로우하는 친구 목록 조회',
    description: '현재 사용자가 팔로우하는 친구 목록을 조회합니다.',
  })
  async getFollowing(@Req() req: any) {
    const userId = req.user.userId;
    return this.userService.getFollowing(userId);
  }

  @UseGuards(JwtAuthGuard, LoggedInGuard)
  @Get('followers')
  @ApiOperation({
    summary: '나를 팔로우하는 친구 목록 조회',
    description: '현재 사용자를 팔로우하는 친구 목록과 맞팔 여부를 조회합니다.',
  })
  async getFollowers(@Req() req: any) {
    const userId = req.user.userId;
    return this.userService.getFollowers(userId);
  }

  @Get('check-nickname')
  @ApiOperation({
    summary: '닉네임 중복 검사 API',
    description: '입력된 닉네임의 사용 가능 여부를 확인합니다.',
  })
  async checkNicknameAvailability(
    @Query('nickname') nickname: string,
  ): Promise<{ available: boolean }> {
    const isAvailable =
      await this.userService.checkNicknameAvailability(nickname);
    return { available: isAvailable };
  }
}
