import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CommentDto } from 'src/comments/dto';
import { ArticleDto } from '.';

export class ArticleWithCommentsDto extends ArticleDto {
  @ApiProperty({
    description: '게시글에 연결된 댓글 목록',
    type: [CommentDto],
    isArray: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommentDto)
  comments: CommentDto[];
}
