import { Controller, Param, Post, Request } from '@nestjs/common';
import { PlanetService } from './planet.service';

@Controller('planet')
export class PlanetController {
  constructor(private readonly planetService: PlanetService) {}

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
