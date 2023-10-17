import { ApiProperty } from '@nestjs/swagger';
import { PlanetShape } from '@prisma/client';
import { IsString, IsOptional, IsBoolean, IsInt } from 'class-validator';

export class UpdatePlanetDto {
  @ApiProperty({ description: '행성 이름' })
  @IsString()
  name?: string;

  @ApiProperty({ description: '행성 설명' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '공개/비공개 설정' })
  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @ApiProperty({ description: '행성 주인 ID' })
  @IsOptional()
  @IsInt()
  ownerId: number;

  @ApiProperty({ description: '행성 모양' })
  @IsOptional()
  @IsString()
  shape?: PlanetShape;

  @ApiProperty({ description: '행성 해시태그' })
  @IsOptional()
  @IsString()
  hashtags?: string[];
}