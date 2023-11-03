import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ApproveReportDto {
  @ApiProperty({
    description: '신고를 승인하는 이유',
    example: '규정 위반 내용이 확인되었습니다.',
  })
  @IsNotEmpty()
  @IsString()
  approvalReason: string;
}
