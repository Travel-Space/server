import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { ReportTargetType } from '@prisma/client';

export class CreateReportDto {
  @ApiProperty({ description: '신고 이유' })
  @IsString()
  reason: string;

  @ApiProperty({ description: '신고 대상 ID' })
  @IsInt()
  targetId: number;

  @ApiProperty({ description: '신고 대상 유형', enum: ReportTargetType })
  @IsEnum(ReportTargetType)
  targetType: ReportTargetType;

  @ApiProperty({ description: '관련 이미지 URL', required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
