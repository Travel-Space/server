import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateArticleDto,
  CreateCommentDto,
  UpdateArticleDto,
  UpdateCommentDto,
} from './dto';

@Injectable()
export class ArticlesService {
  constructor(private prisma: PrismaService) {}

  async getAllArticles() {
    return await this.prisma.article.findMany();
  }

  async getArticlesByPlanetId(planetId: number) {
    return await this.prisma.article.findMany({
      where: {
        planetId: planetId,
      },
    });
  }

  async createArticle(data: CreateArticleDto, userId: number) {
    return this.prisma.article.create({
      data: {
        ...data,
        authorId: userId,
      },
    });
  }

  async isUserToPlanet(userId: number, planetId: number): Promise<boolean> {
    const membership = await this.prisma.planetMembership.findUnique({
      where: {
        planetId_userId: {
          userId: userId,
          planetId: planetId,
        },
      },
    });
    return !!membership;
  }
  async updateArticle(id: number, data: UpdateArticleDto, userId: number) {
    const article = await this.prisma.article.findUnique({ where: { id } });
    if (!article) throw new NotFoundException('게시글을 찾을 수 없습니다.');
    if (article.authorId !== userId)
      throw new ForbiddenException('권한이 없습니다.');

    return this.prisma.article.update({
      where: { id },
      data,
    });
  }

  async deleteArticle(id: number, userId: number) {
    const article = await this.prisma.article.findUnique({ where: { id } });
    if (!article) throw new NotFoundException('게시글을 찾을 수 없습니다.');
    if (article.authorId !== userId)
      throw new ForbiddenException('권한이 없습니다.');

    return this.prisma.article.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

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
