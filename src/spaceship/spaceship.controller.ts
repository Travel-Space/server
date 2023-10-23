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
import { UpdateSpaceshipDto } from './dto/update-spaceship.dto'; // 필요하다면 추가

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
