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
    summary: '모든 행성 조회 API',
    description: '모든 행성을 불러옵니다.',
  })
  @ApiResponse({
    status: 201,
    description: '모든 행성을 불러왔습니다.',
  })
  async getAllSpaceships() {
    return this.spaceshipService.getAllSpaceships();
  }

  @Get(':id')
  async getSpaceshipById(@Param('id') id: number) {
    return this.spaceshipService.getSpaceshipById(id);
  }

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

  @Delete(':id')
  async deleteSpaceship(@Param('id') id: number, @Req() req: any) {
    return this.spaceshipService.deleteSpaceship(req.user.id, id);
  }
}
