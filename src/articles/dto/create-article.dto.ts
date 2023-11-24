import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsArray,
  ValidateNested,
  IsNumber,
} from 'class-validator';

export class CreateArticleDto {
  @ApiProperty({ description: '게시글 제목' })
  @IsString()
  title: string;

  @ApiProperty({ description: '게시글 내용' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ description: '공개/비공개 설정' })
  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @ApiProperty({ description: '행성 ID' })
  @IsOptional()
  @IsInt()
  planetId?: number;

  @ApiProperty({ description: '게시글 주소' })
  @IsString()
  address: string;

  @ApiProperty({ description: '위도' })
  @IsNumber()
  latitude: number;

  @ApiProperty({ description: '경도' })
  @IsNumber()
  longitude: number;

  @ApiProperty({ description: '게시글 이미지 URL 목록' })
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @ApiProperty({ description: '행성 해시태그' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hashtags?: string[];

  @ApiProperty({ description: '연관될 우주선 ID' })
  @IsOptional()
  @IsInt()
  spaceshipId?: number;
}
