import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ description: '댓글 내용' })
  @IsString()
  content: string;

  @ApiProperty({ description: '게시글 ID' })
  @IsInt()
  articleId: number;

  @ApiProperty({ description: '부모댓글 ID(대댓글용)' })
  @IsOptional()
  @IsInt()
  parentId?: number;
}
