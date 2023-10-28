import {
  BadRequestException,
  ConflictException,
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

  async getAllArticles(userId: number) {
    const articles = await this.prisma.article.findMany({
      include: {
        author: true,
        planet: true,
        likes: true,
        comments: true,
      },
    });

    return articles.map((article) => ({
      ...article,
      likeCount: article.likes.length,
      isLiked: article.likes.some((like) => like.userId === userId),
    }));
  }
  async getArticleById(articleId: number, userId: number) {
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
      include: {
        author: true,
        planet: true,
        likes: true,
        comments: true,
      },
    });

    if (!article) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    return {
      ...article,
      likeCount: article.likes.length,
      isLiked: article.likes.some((like) => like.userId === userId),
    };
  }

  async getArticlesByPlanetId(planetId: number, userId: number) {
    const articles = await this.prisma.article.findMany({
      where: {
        planetId: planetId,
      },
      include: {
        author: true,
        planet: true,
        likes: true,
        comments: true,
      },
    });

    return articles.map((article) => ({
      ...article,
      likeCount: article.likes.length,
      isLiked: article.likes.some((like) => like.userId === userId),
    }));
  }

  async createArticle(data: CreateArticleDto, userId: number) {
    try {
      const prismaInput = this.transformArticleDtoToPrismaInput(data);
      return await this.prisma.article.create({
        data: {
          ...prismaInput,
          authorId: userId,
        },
      });
    } catch (error) {
      console.error(error);
      throw new BadRequestException('게시글 생성 중 오류가 발생했습니다.');
    }
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

    const prismaInput = this.transformArticleDtoToPrismaInput(data);
    return this.prisma.article.update({
      where: { id },
      data: prismaInput,
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
  async getArticlesByAuthor(authorId: number, userId: number) {
    const articles = await this.prisma.article.findMany({
      where: {
        authorId: authorId,
      },
      include: {
        author: true,
        planet: true,
        likes: true,
        comments: true,
      },
    });

    return articles.map((article) => ({
      ...article,
      likeCount: article.likes.length,
      isLiked: article.likes.some((like) => like.userId === userId),
    }));
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

    return await this.prisma.like.create({
      data: {
        userId: userId,
        articleId: articleId,
      },
    });
  }

  async removeLike(userId: number, articleId: number) {
    const existingLike = await this.prisma.like.findUnique({
      where: {
        userId_articleId: {
          userId: userId,
          articleId: articleId,
        },
      },
    });

    if (!existingLike) {
      throw new NotFoundException('좋아요 정보를 찾을 수 없습니다.');
    }

    return await this.prisma.like.delete({
      where: {
        userId_articleId: {
          userId: userId,
          articleId: articleId,
        },
      },
    });
  }

  transformArticleDtoToPrismaInput(
    dto: CreateArticleDto | UpdateArticleDto,
  ): any {
    const data: any = { ...dto };

    if (dto.locations) {
      data.locations = {
        create: dto.locations.map((location) => ({
          latitude: parseFloat(location.latitude),
          longitude: parseFloat(location.longitude),
        })),
      };
    }

    return data;
  }
}
