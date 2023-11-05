import { ApiProperty } from '@nestjs/swagger';
import {
  IsDate,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateSpaceshipDto {
  @ApiProperty({ description: '우주선 이름', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: '우주선 설명', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '우주선 최대 인원수', required: false })
  @IsInt()
  @IsOptional()
  maxMembers?: number;

  @ApiProperty({ description: '우주선 이륙일', required: false })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ description: '우주선 복귀일', required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ description: '우주선이 속한 행성 ID', required: false })
  @IsInt()
  @IsOptional()
  planetId?: number;
}
