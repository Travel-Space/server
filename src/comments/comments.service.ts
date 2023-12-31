import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCommentDto, UpdateCommentDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationService } from 'src/notification/notification.service';
import { NotificationGateway } from 'src/notification/notification.gateway';

@Injectable()
export class CommentsService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    private notificationGateway: NotificationGateway,
  ) {}

  async createComment(
    data: CreateCommentDto,
    userId: number,
    articleId: number,
  ) {
    let content;

    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    if (data.parentId) {
      const parentComment = await this.prisma.comment.findUnique({
        where: { id: data.parentId },
      });
      if (!parentComment) {
        throw new NotFoundException('부모 댓글을 찾을 수 없습니다.');
      }
      if (parentComment.articleId !== articleId) {
        throw new BadRequestException(
          '부모 댓글의 게시글 ID와 일치하지 않습니다.',
        );
      }

      if (parentComment.authorId !== userId) {
        content = `${user.nickName} 님이 회원님의 댓글에 대댓글을 달았어요.`;
        const notification = await this.prisma.notification.create({
          data: {
            userId: parentComment.authorId,
            content,
            userNickName: user.nickName,
            commentId: data.parentId,
            articleId,
            planetId: article.planetId,
            type: 'SUB_COMMENT',
          },
        });
        this.notificationGateway.sendNotificationToUser(
          parentComment.authorId,
          notification.id,
        );
        this.notificationGateway.server
          .to(parentComment.authorId.toString())
          .emit('notifications', notification);
      }
    }

    const newComment = await this.prisma.comment.create({
      data: {
        ...data,
        authorId: userId,
        articleId: articleId,
      },
    });

    if (article && article.authorId !== userId) {
      content = `${user.nickName} 님이 회원님의 게시글에 댓글을 달았어요.`;
      const notification = await this.prisma.notification.create({
        data: {
          userId: article.authorId,
          content,
          userNickName: user.nickName,
          commentId: newComment.id,
          articleId,
          planetId: article.planetId,
          type: 'COMMENT',
        },
      });
      this.notificationGateway.sendNotificationToUser(
        article.authorId,
        notification.id,
      );
      this.notificationGateway.server
        .to(article.authorId.toString())
        .emit('notifications', notification);
    }

    return newComment;
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
              planetId: true,
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
    const totalTopLevelCommentsCount = await this.prisma.comment.count({
      where: {
        articleId: articleId,
        parentId: null,
      },
    });

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
            nationImage: true,
          },
        },
      },
      take: pageSize,
      skip: (page - 1) * pageSize,
      orderBy: { createdAt: 'desc' },
    });

    return {
      comments: comments.map((comment) => ({
        ...comment,
        childCommentCount: comment._count.children,
        authorProfileImage: comment.author.profileImage,
        authorNationality: comment.author.nationality,
        authorNickName: comment.author.nickName,
      })),
      totalTopLevelCommentsCount,
    };
  }

  async getMoreChildComments(parentId: number, page: number, pageSize: number) {
    const totalChildCommentsCount = await this.prisma.comment.count({
      where: {
        parentId: parentId,
      },
    });

    const skip = (page - 1) * pageSize;

    const childComments = await this.prisma.comment.findMany({
      where: {
        parentId: parentId,
      },
      include: {
        author: {
          select: {
            profileImage: true,
            nationality: true,
            nickName: true,
            nationImage: true,
          },
        },
      },
      take: pageSize,
      skip: skip,
      orderBy: { createdAt: 'desc' },
    });

    return {
      childComments,
      totalChildCommentsCount,
    };
  }
}
