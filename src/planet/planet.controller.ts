import { Body, Controller, Param, Post, Request, Put } from '@nestjs/common';
import { PlanetService } from './planet.service';
import { CreatePlanetDto } from './dto/create-planet.dto';

@Controller('planet')
export class PlanetController {
  constructor(private readonly planetService: PlanetService) {}

  @Post()
  async createPlanet(@Body() data: CreatePlanetDto) {
    return this.planetService.createPlanet(data);
  }

  @Put(':planetId')
  async updatePlanet(
    @Param('planetId') planetId: number,
    @Body('ownerId') ownerId: number,
    @Body() data: CreatePlanetDto,
  ) {
    return this.planetService.updatePlanet(planetId, ownerId, data);
  }

  @Post('join/:planetId')
  async joinPlanet(
    @Request() req,
    @Param('planetId') planetId: number,
  ): Promise<any> {
    const userId = req.user.id;
    await this.planetService.joinPlanet(userId, planetId);
    return { message: '행성에 성공적으로 가입되었습니다.' };
  }
}
