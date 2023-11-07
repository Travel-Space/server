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

  async getAllArticles(
    userId: number,
    page: number,
    limit: number = 10,
    planetName?: string,
    authorNickname?: string,
    title?: string,
  ) {
    const skip = (page - 1) * limit;
    const where = {};

    if (planetName) {
      where['planet'] = {
        is: {
          name: {
            contains: planetName,
            mode: 'insensitive',
          },
        },
      };
    }

    if (authorNickname) {
      where['author'] = {
        is: {
          nickName: {
            contains: authorNickname,
            mode: 'insensitive',
          },
        },
      };
    }

    if (title) {
      where['title'] = {
        contains: title,
        mode: 'insensitive',
      };
    }

    const articles = await this.prisma.article.findMany({
      where,
      skip,
      take: limit,
      include: {
        author: {
          select: { nickName: true },
        },
        planet: {
          select: { name: true },
        },
        likes: true,
        comments: true,
        locations: true,
        images: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    const totalArticlesCount = await this.prisma.article.count({ where });

    const mappedArticles = articles.map((article) => ({
      ...article,
      authorNickname: article.author?.nickName,
      planetName: article.planet?.name,
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

  async getAllArticlesByPlanetId(planetId: number, userId: number) {
    const whereCondition = {
      planetId: planetId,
    };

    const articles = await this.prisma.article.findMany({
      where: whereCondition,
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
      where: whereCondition,
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

  async getArticlesByPlanetId(
    planetId: number,
    userId: number,
    page?: number,
    limit?: number,
    spaceshipName?: string,
  ) {
    const skip = page && limit ? (page - 1) * limit : undefined;
    const take = limit || undefined;

    let spaceshipIdFilter = {};
    if (spaceshipName) {
      const spaceship = await this.prisma.spaceship.findFirst({
        where: { name: spaceshipName },
        select: { id: true },
      });
      if (!spaceship) {
        throw new NotFoundException('해당 이름을 가진 우주선이 없습니다.');
      }
      spaceshipIdFilter = { spaceshipId: spaceship.id };
    }

    const articles = await this.prisma.article.findMany({
      where: {
        planetId,
        ...spaceshipIdFilter,
        published: true,
      },
      skip,
      take,
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
      where: {
        planetId,
        ...spaceshipIdFilter,
        published: true,
      },
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

  async getArticlesByLocation(
    userId: number,
    latitude: number,
    planetId: number,
    longitude: number,
    radius: number,
    page: number,
    limit: number,
  ) {
    const skip = (page - 1) * limit;
    const take = limit;

    const whereCondition = {
      AND: [
        {
          planetId,
        },
        {
          published: true,
        },
        {
          locations: {
            some: {
              AND: [
                {
                  latitude: {
                    gte: latitude - this.degreesToRadians(radius / 111.32),
                    lte: latitude + this.degreesToRadians(radius / 111.32),
                  },
                },
                {
                  longitude: {
                    gte:
                      longitude -
                      this.degreesToRadians(
                        radius /
                          (111.32 * Math.cos(this.degreesToRadians(latitude))),
                      ),
                    lte:
                      longitude +
                      this.degreesToRadians(
                        radius /
                          (111.32 * Math.cos(this.degreesToRadians(latitude))),
                      ),
                  },
                },
              ],
            },
          },
        },
      ],
    };

    const articles = await this.prisma.article.findMany({
      where: whereCondition,
      skip,
      take,
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
      where: whereCondition,
    });

    return {
      total: totalArticlesCount,
      totalPages: Math.ceil(totalArticlesCount / limit),
      currentPage: page,
      articles: articles.map((article) => ({
        ...article,
        likeCount: article.likes.length,
        isLiked: article.likes.some((like) => like.userId === userId),
      })),
    };
  }

  private degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
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
        spaceship: dto.spaceshipId
          ? { connect: { id: dto.spaceshipId } }
          : undefined,
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
        spaceship: true,
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

  async deleteArticleByAdmin(id: number) {
    const article = await this.prisma.article.findUnique({ where: { id } });
    if (!article) throw new NotFoundException('게시글을 찾을 수 없습니다.');

    await this.prisma.article.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
