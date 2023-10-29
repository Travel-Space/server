import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArticleDto, UpdateArticleDto } from './dto';

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

  async createArticle(dto: CreateArticleDto, userId: number) {
    const newArticle = await this.prisma.article.create({
      data: {
        title: dto.title,
        content: dto.content,
        published: dto.published ?? true, // 옵셔널한 필드에 대해 기본값 설정
        address: dto.address,
        hashtags: dto.hashtags,
        author: {
          connect: { id: userId },
        },
        planet: dto.planetId ? { connect: { id: dto.planetId } } : undefined,
        locations: {
          create: dto.locations.map((location) => ({
            latitude: location.latitude,
            longitude: location.longitude,
          })),
        },
        images:
          dto.imageUrls && dto.imageUrls.length > 0
            ? {
                create: dto.imageUrls.map((url) => ({ url })),
              }
            : undefined,
      },
    });

    return newArticle;
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

  async updateArticle(id: number, dto: UpdateArticleDto, userId: number) {
    const article = await this.prisma.article.findUnique({ where: { id } });
    if (!article) throw new NotFoundException('게시글을 찾을 수 없습니다.');
    if (article.authorId !== userId)
      throw new ForbiddenException('권한이 없습니다.');

    const updatedArticle = await this.prisma.article.update({
      where: { id },
      data: {
        title: dto.title,
        content: dto.content,
        published: dto.published ?? true,
        address: dto.address,
        hashtags: dto.hashtags,
        planet: dto.planetId ? { connect: { id: dto.planetId } } : undefined,
        locations: {
          create: dto.locations?.map((location) => ({
            latitude: parseFloat(location.latitude),
            longitude: parseFloat(location.longitude),
          })),
        },
        images:
          dto.imageUrls && dto.imageUrls.length > 0
            ? {
                create: dto.imageUrls.map((url) => ({ url })),
              }
            : undefined,
      },
    });

    return updatedArticle;
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
}
