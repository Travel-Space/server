import { ApiProperty, ApiQuery } from '@nestjs/swagger';
import { ReportStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class SearchReportsDto {
  @ApiProperty({ required: false, description: '신고자의 이름' })
  @IsOptional()
  @IsString()
  readonly name?: string;

  @ApiProperty({ required: false, description: '신고자의 이메일' })
  @IsOptional()
  @IsString()
  readonly email?: string;

  @ApiProperty({
    required: false,
    enum: ReportStatus,
    description: '신고의 상태',
  })
  @IsOptional()
  @IsEnum(ReportStatus)
  readonly status?: ReportStatus;

  @ApiProperty({ required: false, description: '페이지 번호' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  readonly page?: number;

  @ApiProperty({ required: false, description: '페이지당 항목 수' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  readonly pageSize?: number;
}
