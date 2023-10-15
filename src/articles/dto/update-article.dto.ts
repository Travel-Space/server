import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsInt } from 'class-validator';

export class UpdateArticleDto {
  @ApiProperty({ description: '게시글 제목' })
  @IsOptional()
  @IsString()
  title?: string;

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
}
