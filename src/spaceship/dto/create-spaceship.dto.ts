import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsDateString, IsInt, IsString } from 'class-validator';

export class CreateSpaceshipDto {
  @ApiProperty({ description: '우주선 이름' })
  @IsString()
  name: string;

  @ApiProperty({ description: '우주선 설명' })
  @IsString()
  description: string;

  @ApiProperty({ description: '우주선 최대 인원수' })
  @IsInt()
  maxMembers: number;

  @ApiProperty({ description: '우주선 이륙일' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: '우주선 복귀일' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ description: '우주선이 속한 행성 ID' })
  @IsInt()
  planetId: number;

  @ApiProperty({ description: '우주선 대표 이미지' })
  @IsString()
  image: string;
}
