import {
  Body,
  Controller,
  Param,
  Post,
  Request,
  Put,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PlanetService } from './planet.service';
import { CreatePlanetDto } from './dto/create-planet.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';

@Controller('planet')
export class PlanetController {
  constructor(private readonly planetService: PlanetService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createPlanet(@Body() dto: CreatePlanetDto, @Req() req: any) {
    return await this.planetService.createPlanet(dto, req.user.userId);
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
