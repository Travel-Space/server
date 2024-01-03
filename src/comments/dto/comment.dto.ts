import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsString,
  IsDate,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CommentDto {
  @ApiProperty({ description: '댓글 ID' })
  @IsNumber()
  id: number;

  @ApiProperty({ description: '댓글 내용' })
  @IsString()
  content: string;

  @ApiProperty({ description: '댓글 작성자 ID' })
  @IsNumber()
  authorId: number;

  @ApiProperty({ description: '댓글이 속한 게시글 ID' })
  @IsNumber()
  articleId: number;

  @ApiProperty({ description: '부모 댓글 ID', required: false })
  @IsOptional()
  @IsNumber()
  parentId?: number;

  @ApiProperty({ description: '댓글 생성 일자' })
  @IsDate()
  createdAt: Date;

  @ApiProperty({
    description: '대댓글 목록',
    type: [CommentDto],
    isArray: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommentDto)
  children: CommentDto[];
}
