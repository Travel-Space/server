import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateCommentDto {
  @ApiProperty({ description: '댓글 내용' })
  @IsOptional()
  @IsString()
  content?: string;
}
