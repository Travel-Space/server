import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
} from '@nestjs/common';
import { SpaceshipService } from './spaceship.service';
import { CreateSpaceshipDto } from './dto/create-spaceship.dto';
import { UpdateSpaceshipDto } from './dto/update-spaceship.dto';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';

@ApiTags('우주선 API')
@Controller('spaceship')
export class SpaceshipController {
  constructor(private spaceshipService: SpaceshipService) {}

  @Post()
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
      req.user.id,
      createSpaceshipDto,
    );
  }

  @Get()
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
  async updateSpaceship(
    @Param('id') id: number,
    @Body() updateSpaceshipDto: UpdateSpaceshipDto,
    @Req() req: any,
  ) {
    return this.spaceshipService.updateSpaceship(
      req.user.id,
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
  @Delete(':id')
  async deleteSpaceship(@Param('id') id: number, @Req() req: any) {
    return this.spaceshipService.deleteSpaceship(req.user.id, id);
  }
}
