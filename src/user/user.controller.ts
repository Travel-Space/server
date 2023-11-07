import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import {
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiParam,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { AdminGuard, LoggedInGuard } from 'src/auth/guard';
import { SuspendUserDto } from './dto';

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
    description: '한 페이지당 유저 수',
  })
  @ApiQuery({
    name: 'name',
    required: false,
    type: 'string',
    description: '검색할 이름',
  })
  @ApiQuery({
    name: 'nickname',
    required: false,
    type: 'string',
    description: '검색할 닉네임',
  })
  @ApiQuery({
    name: 'email',
    required: false,
    type: 'string',
    description: '검색할 이메일',
  })
  @ApiQuery({
    name: 'isSuspended',
    required: false,
    type: 'boolean',
    description: '활동제한 여부',
  })
  async getAllUsers(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
    @Query('name') name?: string,
    @Query('nickname') nickname?: string,
    @Query('email') email?: string,
    @Query('isSuspended') isSuspended?: boolean,
  ) {
    const { users, total } = await this.userService.getAllUsers({
      page,
      limit,
      name,
      nickname,
      email,
      isSuspended,
    });
    return {
      data: users,
      total,
      page,
      limit,
    };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':userId')
  @ApiOperation({ summary: '유저 정보 삭제하기' })
  async deleteUserByAdmin(@Param('userId') userId: string) {
    return await this.userService.deleteUserByAdmin(userId);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put(':userId')
  @ApiOperation({ summary: '유저 정보 수정하기' })
  async updateUser(@Param('userId') userId: string, @Body() updateData: any) {
    return await this.userService.updateUser(userId, updateData);
  }

  @UseGuards(JwtAuthGuard, LoggedInGuard)
  @Get('profile')
  @ApiOperation({ summary: '내 정보 조회하기' })
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
    description:
      '현재 사용자가 팔로우하는 친구 목록을 페이지네이션하여 조회합니다.',
  })
  @ApiQuery({
    name: 'page',
    type: 'number',
    required: false,
    description: '페이지 번호',
  })
  @ApiQuery({
    name: 'limit',
    type: 'number',
    required: false,
    description: '한 페이지당 친구 수',
  })
  async getFollowing(
    @Req() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const { friends, total } = await this.userService.getFollowing(
      req.user.userId,
      page,
      limit,
    );
    return {
      data: friends,
      total,
      page,
      limit,
    };
  }

  @UseGuards(JwtAuthGuard, LoggedInGuard)
  @Get('followers')
  @ApiOperation({
    summary: '나를 팔로우하는 친구 목록 조회',
    description:
      '현재 사용자를 팔로우하는 친구 목록과 맞팔 여부를 페이지네이션하여 조회합니다.',
  })
  @ApiQuery({
    name: 'page',
    type: 'number',
    required: false,
    description: '페이지 번호',
  })
  @ApiQuery({
    name: 'limit',
    type: 'number',
    required: false,
    description: '한 페이지당 친구 수',
  })
  async getFollowers(
    @Req() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const { followersWithMutual, total } = await this.userService.getFollowers(
      req.user.userId,
      page,
      limit,
    );
    return {
      data: followersWithMutual,
      total,
      page,
      limit,
    };
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

  @UseGuards(JwtAuthGuard, LoggedInGuard)
  @Post(':userId/leave-spaceships')
  @ApiOperation({
    summary: '모든 우주선 탈퇴 API',
    description: '사용자를 모든 우주선 멤버십에서 탈퇴시킵니다.',
  })
  @ApiParam({ name: 'userId', description: '사용자의 고유 ID' })
  async leaveAllSpaceships(
    @Param('userId', ParseIntPipe) userId: number,
    @Req() req: any,
  ): Promise<{ message: string }> {
    if (req.user.userId !== userId) {
      throw new UnauthorizedException('권한이 없습니다.');
    }

    await this.userService.leaveAllSpaceships(userId);

    return { message: '모든 우주선 멤버십에서 탈퇴되었습니다.' };
  }

  @UseGuards(JwtAuthGuard, LoggedInGuard)
  @Post(':userId/leave-planets')
  @ApiOperation({
    summary: '모든 행성 멤버십 탈퇴 API',
    description: '사용자를 모든 행성 멤버십에서 탈퇴시킵니다.',
  })
  @ApiParam({ name: 'userId', description: '사용자의 고유 ID' })
  async leaveAllPlanets(
    @Param('userId', ParseIntPipe) userId: number,
    @Req() req: any,
  ): Promise<{ message: string }> {
    if (req.user.userId !== userId) {
      throw new UnauthorizedException('권한이 없습니다.');
    }

    await this.userService.leaveAllPlanets(userId);

    return { message: '모든 행성 멤버십에서 탈퇴되었습니다.' };
  }

  @UseGuards(JwtAuthGuard, LoggedInGuard)
  @Delete(':userId')
  @ApiOperation({
    summary: '회원 탈퇴 API',
    description: '사용자 계정을 삭제합니다.',
  })
  @ApiParam({ name: 'userId', description: '삭제할 사용자의 고유 ID' })
  async deleteUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Req() req: any,
  ): Promise<{ message: string }> {
    if (req.user.userId !== userId) {
      throw new UnauthorizedException('권한이 없습니다.');
    }

    await this.userService.deleteUser(userId);

    return { message: '계정이 삭제되었습니다.' };
  }

  @UseGuards(JwtAuthGuard, LoggedInGuard)
  @Get('/other/:userId')
  @ApiOperation({ summary: '다른 사용자 정보 조회하기' })
  async getOtherUser(
    @Req() req: any,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return await this.userService.getUserByOtherId(req.user.userId, userId);
  }

  @UseGuards(JwtAuthGuard, LoggedInGuard)
  @Get('other/:userId/following')
  @ApiOperation({
    summary: '특정 사용자가 팔로우하는 친구 목록 조회',
    description:
      '특정 사용자가 팔로우하는 친구 목록을 페이지네이션하여 조회합니다.',
  })
  @ApiQuery({
    name: 'page',
    type: 'number',
    required: false,
    description: '페이지 번호',
  })
  @ApiQuery({
    name: 'limit',
    type: 'number',
    required: false,
    description: '한 페이지당 친구 수',
  })
  async getOtherUserFollowing(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const { friends, total } = await this.userService.getFollowing(
      userId,
      page,
      limit,
    );
    return {
      data: friends,
      total,
      page,
      limit,
    };
  }

  @UseGuards(JwtAuthGuard, LoggedInGuard)
  @Get('other/:userId/followers')
  @ApiOperation({
    summary: '특정 사용자를 팔로우하는 친구 목록 조회',
    description:
      '특정 사용자를 팔로우하는 친구 목록과 맞팔 여부를 페이지네이션하여 조회합니다.',
  })
  @ApiQuery({
    name: 'page',
    type: 'number',
    required: false,
    description: '페이지 번호',
  })
  @ApiQuery({
    name: 'limit',
    type: 'number',
    required: false,
    description: '한 페이지당 친구 수',
  })
  async getOtherUserFollowers(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const { followersWithMutual, total } = await this.userService.getFollowers(
      userId,
      page,
      limit,
    );
    return {
      data: followersWithMutual,
      total,
      page,
      limit,
    };
  }

  @UseGuards(JwtAuthGuard, LoggedInGuard)
  @Get('followers/not-mutual')
  @ApiOperation({
    summary: '맞팔로우하지 않는 친구 목록 조회',
    description:
      '현재 사용자를 팔로우하고 있지만 맞팔로우하지 않는 친구 목록을 페이지네이션하여 조회합니다.',
  })
  @ApiQuery({
    name: 'page',
    type: 'number',
    required: false,
    description: '페이지 번호',
  })
  @ApiQuery({
    name: 'limit',
    type: 'number',
    required: false,
    description: '한 페이지당 친구 수',
  })
  async getNotMutualFollowers(
    @Req() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const { followersWithMutual, total } = await this.userService.getFollowers(
      req.user.userId,
      page,
      limit,
    );

    let data = followersWithMutual.filter((follower) => !follower.isMutual);

    if (data.length === 0) {
      const randomUsers = await this.userService.getRandomUsers(
        10,
        req.user.userId,
      );
      data = randomUsers.map((user) => ({
        isMutual: false,
        user: user,
        userId: user.id,
        friendId: req.user.userId,
      }));
    }

    return {
      data: data,
      total: data.length,
      page,
      limit,
    };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':userId/suspend')
  @ApiOperation({
    summary: '사용자 활동 제한',
    description: '관리자가 특정 사용자의 활동을 제한합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '사용자 활동 제한 성공',
  })
  @ApiBody({
    description: '활동 제한 정보',
    type: SuspendUserDto,
  })
  async suspendUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() suspendUserDto: SuspendUserDto,
  ) {
    return await this.userService.suspendUser(userId, suspendUserDto);
  }
}
