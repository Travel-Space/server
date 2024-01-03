import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class FindArticlesByPlanetDto {
  @ApiProperty({ description: '행성 ID' })
  @IsNotEmpty()
  @IsNumber()
  planetId: number;
}
