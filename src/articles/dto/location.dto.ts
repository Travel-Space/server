import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class LocationDto {
  @ApiProperty({ description: '위도', example: 37.4224764 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ description: '경도', example: -122.0842499 })
  @IsNumber()
  longitude: number;
}
