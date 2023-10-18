import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { SpaceshipService } from './spaceship.service';

@Controller('spaceship')
export class SpaceshipController {
  constructor(private spaceshipService: SpaceshipService) {}

  @Post()
  async createSpaceship(@Body() data: any) {
    return this.spaceshipService.createSpaceship(data);
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
  async updateSpaceship(@Param('id') id: number, @Body() data: any) {
    return this.spaceshipService.updateSpaceship(id, data);
  }

  @Delete(':id')
  async deleteSpaceship(@Param('id') id: number) {
    return this.spaceshipService.deleteSpaceship(id);
  }
}
