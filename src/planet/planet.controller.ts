import {
  Body,
  Controller,
  Param,
  Post,
  Request,
  Put,
  UseGuards,
  Req,
  Get,
  Delete,
  ForbiddenException,
  ParseIntPipe,
} from '@nestjs/common';
import { PlanetService } from './planet.service';
import { CreatePlanetDto, UpdateMemberRoleDto, UpdatePlanetDto } from './dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { MembershipStatus } from '@prisma/client';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Planet API')
@Controller('planet')
export class PlanetController {
  constructor(private readonly planetService: PlanetService) {}

  @Get()
  @ApiOperation({
    summary: '모든 행성 조회 API',
    description: '모든 행성을 불러옵니다.',
  })
  @ApiResponse({
    status: 201,
    description: '모든 행성을 불러왔습니다.',
  })
  async getAllPlanet() {
    return await this.planetService.getAllPlanet();
  }
  @Get('my-planets')
  @ApiOperation({
    summary: '내가 가입된 행성 조회 API',
    description: '사용자가 가입된 모든 행성을 불러옵니다.',
  })
  @ApiResponse({
    status: 200,
    description: '내가 가입된 행성을 불러왔습니다.',
  })
  async getMyPlanets(@Req() req: any) {
    return await this.planetService.getMyPlanets(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({
    summary: '행성 생성 API',
    description: '새로운 행성을 생성합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '행성 생성 성공',
  })
  @ApiBody({ type: CreatePlanetDto })
  async createPlanet(@Body() dto: CreatePlanetDto, @Req() req: any) {
    return await this.planetService.createPlanet(dto, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':planetId')
  @ApiOperation({
    summary: '행성 수정 API',
    description: '행성을 수정합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '행성 업데이트 성공',
  })
  @ApiBody({ type: UpdatePlanetDto })
  async updatePlanet(
    @Param('planetId') planetId: number,
    @Request() req: any,
    @Body() data: UpdatePlanetDto,
  ): Promise<any> {
    const userId = req.user.id;

    return this.planetService.updatePlanet(planetId, userId, data);
  }

  @UseGuards(JwtAuthGuard)
  @Post('join/:planetId')
  @ApiOperation({
    summary: '행성 가입 API',
    description: '행성에 가입합니다.',
  })
  @ApiParam({ name: 'planetId', description: '행성의 고유 ID' })
  async joinPlanet(
    @Req() req: any,
    @Param('planetId', ParseIntPipe) planetId: number,
  ): Promise<any> {
    const userId = req.user.userId;
    const result = await this.planetService.joinPlanet(userId, planetId);

    if (result === MembershipStatus.APPROVED) {
      return { message: '행성에 성공적으로 가입되었습니다.' };
    } else if (result === MembershipStatus.PENDING) {
      return {
        message: '행성 가입 신청이 완료되었습니다. 승인을 기다려주세요.',
      };
    } else {
      throw new ForbiddenException('행성 가입에 실패하였습니다.');
    }
  }

  @Post('leave/:planetId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: '행성 탈출 API',
    description: '행성을 탈출합니다.',
  })
  @ApiParam({ name: 'planetId', description: '행성의 고유 ID' })
  async leavePlanet(@Req() req: any, @Param('planetId') planetId: number) {
    const userId = req.user.userId;
    await this.planetService.leavePlanet(userId, planetId);
    return { message: '행성에서 성공적으로 탈출하였습니다.' };
  }

  @Get('members/:planetId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: '행성 멤버 리스트 조회 API',
    description: '해당 행성의 모든 멤버를 조회합니다.',
  })
  @ApiParam({ name: 'planetId', description: '행성의 고유 ID' })
  async listPlanetMembers(@Param('planetId') planetId: number) {
    return await this.planetService.listPlanetMembers(planetId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('members/:planetId/:userId')
  @ApiOperation({
    summary: '행성 멤버 권한 수정 API',
    description: '행성에 속한 멤버의 권한을 수정합니다.',
  })
  @ApiParam({ name: 'planetId', description: '행성의 고유 ID' })
  @ApiParam({ name: 'userId', description: '유저의 고유 ID' })
  @ApiBody({ type: UpdateMemberRoleDto })
  async updateMemberRole(
    @Param('planetId') planetId: number,
    @Param('userId') userId: number,
    @Body() updateMemberRoleDto: UpdateMemberRoleDto,
  ) {
    const { isAdmin } = updateMemberRoleDto;
    return await this.planetService.updateMemberRole(planetId, userId, isAdmin);
  }

  @Post('approve/:planetId/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: '행성 가입 승인 API',
    description: '행성 가입 신청을 승인합니다.',
  })
  @ApiParam({ name: 'planetId', description: '행성의 고유 ID' })
  @ApiParam({ name: 'userId', description: '유저의 고유 ID' })
  async approveApplication(
    @Req() req: any,
    @Param('planetId') planetId: number,
    @Param('userId') targetUserId: number,
  ): Promise<any> {
    const response = await this.planetService.approveApplication(
      req.user.userId,
      targetUserId,
      planetId,
    );
    return { message: response };
  }

  @Post('reject/:planetId/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: '행성 가입 거절 API',
    description: '행성 가입 신청을 거절합니다.',
  })
  @ApiParam({ name: 'planetId', description: '행성의 고유 ID' })
  @ApiParam({ name: 'userId', description: '유저의 고유 ID' })
  async rejectApplication(
    @Req() req: any,
    @Param('planetId') planetId: number,
    @Param('userId') targetUserId: number,
  ): Promise<any> {
    const response = await this.planetService.rejectApplication(
      req.user.userId,
      targetUserId,
      planetId,
    );
    return { message: response };
  }

  @Delete('kick/:planetId/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: '행성 추방 API',
    description: '행성에 속한 멤버를 추방시킵니다..',
  })
  @ApiParam({ name: 'planetId', description: '행성의 고유 ID' })
  @ApiParam({ name: 'userId', description: '유저의 고유 ID' })
  async kickMember(
    @Req() req: any,
    @Param('planetId') planetId: number,
    @Param('userId') targetUserId: number,
  ) {
    const currentUserId = req.user.userId;

    const membership = await this.planetService.getMembership(
      currentUserId,
      planetId,
    );

    if (
      !membership ||
      (!membership.administrator && membership.planet.ownerId !== currentUserId)
    ) {
      throw new ForbiddenException(
        '행성의 관리자 또는 주인만 회원을 추방할 수 있습니다.',
      );
    }

    await this.planetService.leavePlanet(targetUserId, planetId);
    return { message: '사용자가 행성에서 성공적으로 추방되었습니다.' };
  }

  @Get('pending-applications')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: '가입 대기 중인 신청 목록 조회 API',
    description: '관리자로 속한 행성의 가입 대기 중인 신청 목록을 조회합니다.',
  })
  async getPendingApplications(@Req() req: any): Promise<any> {
    const userId = req.user.userId;
    const applications =
      await this.planetService.getPendingApplications(userId);
    return applications;
  }
}
