import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArticleDto, UpdateArticleDto } from './dto';
import { Article } from '@prisma/client';

@Injectable()
export class ArticlesService {
  constructor(private prisma: PrismaService) {}

  async getAllArticles(userId: number, page: number, limit: number = 10) {
    const skip = (page - 1) * limit;

    const articles = await this.prisma.article.findMany({
      skip,
      take: limit,
      include: {
        author: true,
        planet: true,
        likes: true,
        comments: true,
        locations: true,
        images: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    const totalArticlesCount = await this.prisma.article.count();

    const mappedArticles = articles.map((article) => ({
      ...article,
      likeCount: article.likes.length,
      isLiked: article.likes.some((like) => like.userId === userId),
    }));
    return {
      total: totalArticlesCount,
      articles: mappedArticles,
    };
  }

  async getArticleById(articleId: number, userId: number) {
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
      include: {
        author: true,
        planet: true,
        likes: true,
        comments: true,
        locations: true,
        images: true,
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

  async getArticlesByPlanetId(
    planetId: number,
    userId: number,
    page: number,
    limit: number,
  ) {
    const skip = (page - 1) * limit;
    const articles = await this.prisma.article.findMany({
      where: {
        planetId: planetId,
      },
      skip,
      take: limit,
      include: {
        author: true,
        planet: true,
        likes: true,
        comments: true,
        locations: true,
        images: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    const totalArticlesCount = await this.prisma.article.count({
      where: { planetId },
    });

    return {
      total: totalArticlesCount,
      articles: articles.map((article) => ({
        ...article,
        likeCount: article.likes.length,
        isLiked: article.likes.some((like) => like.userId === userId),
      })),
    };
  }

  async createArticle(dto: CreateArticleDto, userId: number) {
    const newArticle = await this.prisma.article.create({
      data: {
        title: dto.title,
        content: dto.content,
        published: dto.published ?? true,
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
      include: {
        locations: true,
        images: true,
        author: true,
        planet: true,
        likes: true,
        comments: true,
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
      include: {
        locations: true,
        images: true,
        author: true,
        planet: true,
        likes: true,
        comments: true,
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

  async getArticlesByAuthor(
    authorId: number,
    page: number,
    limit: number,
  ): Promise<{ articles: Article[]; totalCount: number }> {
    const skip = (page - 1) * limit;
    const [articles, totalCount] = await Promise.all([
      this.prisma.article.findMany({
        where: {
          authorId: authorId,
        },
        skip,
        take: limit,
        include: {
          author: true,
          planet: true,
          likes: true,
          comments: true,
          locations: true,
          images: true,
        },
      }),
      this.prisma.article.count({
        where: {
          authorId: authorId,
        },
      }),
    ]);

    return {
      articles: articles.map((article) => ({
        ...article,
        likeCount: article.likes.length,
        isLiked: article.likes.some((like) => like.userId === authorId),
      })),
      totalCount,
    };
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
  async getLikedArticles(userId: number, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [likes, totalCount] = await Promise.all([
      this.prisma.like.findMany({
        where: {
          userId: userId,
        },
        skip,
        take: limit,
        include: {
          article: {
            include: {
              planet: true,
              likes: true, // This will include all likes related to the article
            },
          },
        },
        orderBy: {
          article: {
            createdAt: 'desc',
          },
        },
      }),
      this.prisma.like.count({
        where: {
          userId: userId,
        },
      }),
    ]);

    const likedArticles = likes.map((like) => {
      return {
        ...like.article,
        planetName: like.article.planet?.name,
        likeCount: like.article.likes.length,
      };
    });

    return {
      likedArticles,
      totalCount,
    };
  }
}
