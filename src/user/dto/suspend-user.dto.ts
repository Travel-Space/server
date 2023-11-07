import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class SuspendUserDto {
  @ApiProperty({
    example: '2023-12-31',
    description: '활동 제한이 끝나는 날짜',
  })
  @IsNotEmpty()
  @IsString()
  suspensionEndDate: string;

  @ApiProperty({
    example: '부적절한 사용자 행동',
    description: '활동 제한 사유',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  suspensionReason?: string;
}
