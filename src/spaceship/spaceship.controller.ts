import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { SpaceshipService } from './spaceship.service';
import { CreateSpaceshipDto } from './dto/create-spaceship.dto';
import { UpdateSpaceshipDto } from './dto/update-spaceship.dto';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { TransferSpaceshipOwnershipDto, UpdateSpaceshipStatusDto } from './dto';
import { AdminGuard, JwtAuthGuard, LoggedInGuard } from 'src/auth/guard';

@ApiTags('우주선 API')
@Controller('spaceship')
export class SpaceshipController {
  constructor(private spaceshipService: SpaceshipService) {}

  @Post()
  @UseGuards(JwtAuthGuard, LoggedInGuard)
  @ApiOperation({
    summary: '우주선 생성 API',
    description: '우주선을 생성합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '우주선이 생성되었습니다.',
  })
  async createSpaceship(
    @Body() createSpaceshipDto: CreateSpaceshipDto,
    @Req() req: any,
  ) {
    return this.spaceshipService.createSpaceship(
      req.user.userId,
      createSpaceshipDto,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({
    summary: '모든 우주선 조회 API',
    description: '모든 우주선을 불러옵니다.',
  })
  @ApiResponse({
    status: 201,
    description: '모든 우주선을 불러왔습니다.',
  })
  async getAllSpaceships() {
    return this.spaceshipService.getAllSpaceships();
  }

  @UseGuards(JwtAuthGuard, LoggedInGuard)
  @ApiOperation({
    summary: '특정 우주선 조회 API',
    description: '특정 우주선을 불러옵니다.',
  })
  @ApiResponse({
    status: 201,
    description: '우주선을 불러왔습니다.',
  })
  @Get(':id')
  async getSpaceshipById(@Param('id') id: number) {
    return this.spaceshipService.getSpaceshipById(id);
  }

  @ApiOperation({
    summary: '우주선 수정 API',
    description: '우주선 정보를 수정합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '우주선 정보가 업데이트 되었습니다.',
  })
  @Put(':id')
  @UseGuards(JwtAuthGuard, LoggedInGuard)
  async updateSpaceship(
    @Param('id') id: number,
    @Body() updateSpaceshipDto: UpdateSpaceshipDto,
    @Req() req: any,
  ) {
    return this.spaceshipService.updateSpaceship(
      req.user.userId,
      id,
      updateSpaceshipDto,
    );
  }

  @ApiOperation({
    summary: '우주선 폭파 API',
    description: '우주선을 폭파합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '우주선이 폭파되었습니다.',
  })
  @UseGuards(JwtAuthGuard, LoggedInGuard)
  @Delete(':id')
  async deleteSpaceship(@Param('id') id: number, @Req() req: any) {
    return this.spaceshipService.deleteSpaceship(req.user.userId, id);
  }

  @Put('status/:id')
  @UseGuards(JwtAuthGuard, LoggedInGuard)
  @ApiOperation({
    summary: '우주선 상태 변경 API',
    description:
      '우주선의 상태를 변경합니다. 사용자는 자신이 소유한 우주선의 상태만 변경할 수 있습니다.',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: '상태를 변경할 우주선의 고유 ID',
    type: Number,
  })
  @ApiBody({
    description: '우주선의 새 상태를 정의하는 객체',
    type: UpdateSpaceshipStatusDto,
  })
  @ApiResponse({
    status: 200,
    description: '우주선 상태 변경 성공',
  })
  async updateSpaceshipStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSpaceshipStatusDto: UpdateSpaceshipStatusDto,
    @Req() req: any,
  ) {
    const userId = req.user.userId;
    return this.spaceshipService.updateSpaceshipStatus(
      userId,
      id,
      updateSpaceshipStatusDto.status,
    );
  }

  @Post('board/:id')
  @UseGuards(JwtAuthGuard, LoggedInGuard)
  @ApiOperation({
    summary: '우주선 탑승 API',
    description: '우주선에 탑승합니다.',
  })
  @ApiParam({ name: 'id', description: '우주선의 고유 ID' })
  async boardSpaceship(@Param('id') id: number, @Req() req: any) {
    return this.spaceshipService.boardSpaceship(req.user.userId, id);
  }

  @Delete('leave/:id')
  @UseGuards(JwtAuthGuard, LoggedInGuard)
  @ApiOperation({
    summary: '우주선 탈출 API',
    description: '우주선에서 탈출합니다.',
  })
  @ApiParam({ name: 'id', description: '우주선의 고유 ID' })
  async leaveSpaceship(@Param('id') id: number, @Req() req: any) {
    return this.spaceshipService.leaveSpaceship(req.user.userId, id);
  }

  @Get('by-planet/:planetId')
  @UseGuards(JwtAuthGuard, LoggedInGuard)
  @ApiOperation({
    summary: '특정 행성의 모든 우주선 조회 API',
    description: '행성에 속한 모든 우주선을 조회합니다.',
  })
  @ApiParam({ name: 'planetId', description: '행성의 고유 ID' })
  async getSpaceshipsByPlanet(
    @Param('planetId', ParseIntPipe) planetId: number,
  ) {
    return this.spaceshipService.getSpaceshipsByPlanet(planetId);
  }

  @Put('transfer-ownership/:spaceshipId')
  @UseGuards(JwtAuthGuard, LoggedInGuard)
  @ApiOperation({
    summary: '우주선 소유권 이전 API',
    description: '우주선의 소유권을 다른 사용자에게 이전합니다.',
  })
  @ApiParam({
    name: 'spaceshipId',
    description: '소유권을 이전할 우주선의 고유 ID',
  })
  @ApiBody({
    description: 'TransferSpaceshipOwnershipDto',
    type: TransferSpaceshipOwnershipDto,
  })
  @ApiResponse({
    status: 200,
    description: '소유권 이전 성공',
  })
  async transferSpaceshipOwnership(
    @Param('spaceshipId', ParseIntPipe) spaceshipId: number,
    @Body() transferSpaceshipOwnershipDto: TransferSpaceshipOwnershipDto,
    @Req() req: any,
  ) {
    const currentOwnerId = req.user.userId;
    const { newOwnerId } = transferSpaceshipOwnershipDto;

    return this.spaceshipService.transferOwnership(
      spaceshipId,
      currentOwnerId,
      newOwnerId,
    );
  }
}
