import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ApproveReportDto {
  @ApiProperty({
    description: '신고를 승인하는 이유',
    example: '규정 위반 내용이 확인되었습니다.',
  })
  @IsNotEmpty()
  @IsString()
  approvalReason: string;

  @ApiProperty({
    description: '활동 제한 날짜',
    example: '2023-11-10',
  })
  @IsString()
  @IsOptional()
  suspensionEndDate?: string;
}
