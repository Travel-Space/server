import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCommentDto, UpdateCommentDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';

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

  async getCommentsByUserId(userId: number, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [comments, totalCount] = await Promise.all([
      this.prisma.comment.findMany({
        where: {
          authorId: userId,
        },
        skip,
        take: limit,
        include: {
          article: {
            select: {
              title: true,
              createdAt: true,
              planet: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.comment.count({
        where: {
          authorId: userId,
        },
      }),
    ]);

    return {
      comments,
      totalCount,
    };
  }

  async getComments(articleId: number, page: number, pageSize: number) {
    const comments = await this.prisma.comment.findMany({
      where: {
        articleId: articleId,
        parentId: null,
      },
      include: {
        _count: {
          select: { children: true },
        },
        author: {
          select: {
            profileImage: true,
            nationality: true,
            nickName: true,
          },
        },
      },
      take: pageSize,
      skip: (page - 1) * pageSize,
      orderBy: { createdAt: 'desc' },
    });

    return comments.map((comment) => ({
      ...comment,
      childCommentCount: comment._count.children,
      authorProfileImage: comment.author.profileImage,
      authorNationality: comment.author.nationality,
      authorNickName: comment.author.nickName,
    }));
  }

  async getMoreChildComments(
    parentId: number,
    lastChildCommentId: number,
    pageSize: number,
  ) {
    const childComments = await this.prisma.comment.findMany({
      where: {
        parentId: parentId,
        ...(lastChildCommentId && { id: { lt: lastChildCommentId } }),
      },
      include: {
        author: {
          select: {
            profileImage: true,
            nationality: true,
            nickName: true,
          },
        },
      },
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    });

    return childComments;
  }
}
