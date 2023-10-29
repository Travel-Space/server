import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCommentDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateCommentDto } from 'src/articles/dto';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async createComment(
    data: CreateCommentDto,
    userId: number,
    articleId: number,
  ) {
    if (data.parentId) {
      const parentComment = await this.prisma.comment.findUnique({
        where: { id: data.parentId },
      });
      if (!parentComment)
        throw new NotFoundException('부모 댓글을 찾을 수 없습니다.');
      if (parentComment.articleId !== articleId)
        throw new BadRequestException(
          '부모 댓글의 게시글 ID와 일치하지 않습니다.',
        );
    }

    return this.prisma.comment.create({
      data: {
        ...data,
        authorId: userId,
        articleId: articleId,
      },
    });
  }

  async updateComment(id: number, data: UpdateCommentDto, userId: number) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException('댓글을 찾을 수 없습니다.');
    if (comment.authorId !== userId)
      throw new ForbiddenException('권한이 없습니다.');

    return this.prisma.comment.update({
      where: { id },
      data,
    });
  }

  async deleteComment(id: number, userId: number) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException('댓글을 찾을 수 없습니다.');
    if (comment.authorId !== userId)
      throw new ForbiddenException('권한이 없습니다.');

    return this.prisma.comment.delete({ where: { id } });
  }
}
