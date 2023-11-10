import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async createNotification(content: string, userId: number) {
    return this.prisma.notification.create({
      data: {
        content,
        userId,
      },
    });
  }

  async getNotificationsForUser(userId: number) {
    return this.prisma.notification.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async deleteNotification(notificationId: number) {
    return this.prisma.notification.delete({
      where: {
        id: notificationId,
      },
    });
  }

  async notifyUserAboutComment(
    userId: number,
    articleId: number,
    commentContent: string,
  ) {
    const content = `새 댓글이 달렸습니다: ${commentContent}`;

    return this.prisma.notification.create({
      data: {
        userId,
        content,
        articleId,
      },
    });
  }

  async notifyUserAboutLike(likerId: number, articleId: number) {
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
    });

    const content = `게시글이 좋아요를 받았습니다: ${likerId}님이 좋아요를 눌렀습니다.`;

    return this.prisma.notification.create({
      data: {
        userId: article.authorId,
        content,
        articleId,
      },
    });
  }

  async addLike(userId: number, articleId: number) {
    const existingLike = await this.prisma.like.findUnique({
      where: {
        userId_articleId: {
          userId: userId,
          articleId: articleId,
        },
      },
    });

    if (existingLike) {
      throw new ConflictException('이미 좋아요를 눌렀습니다.');
    }

    const like = await this.prisma.like.create({
      data: {
        userId: userId,
        articleId: articleId,
      },
    });

    await this.notifyUserAboutLike(userId, articleId);

    return like;
  }

  async getArticleAuthorId(articleId: number): Promise<number> {
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!article || !article.authorId) {
      throw new NotFoundException('게시글 또는 저자를 찾을 수 없습니다.');
    }

    return article.authorId;
  }
}
