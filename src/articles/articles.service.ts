import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArticleDto, UpdateArticleDto } from './dto';
import { Article, PlanetMemberRole } from '@prisma/client';
import { NotificationGateway } from 'src/notification/notification.gateway';

function validateArticle(article) {
  const { title, content, hashtags, search } = article;

  if (title.length > 50) {
    throw new BadRequestException('게시글 제목은 50자 이하이어야 합니다.');
  }

  if (content.length > 3000) {
    throw new BadRequestException('게시글 본문은 3000자 이하이어야 합니다.');
  }

  if (hashtags.length > 8) {
    throw new BadRequestException('해시태그는 최대 8개까지 가능합니다.');
  }

  if (search.length > 8) {
    throw new BadRequestException('검색어는 8자 이하이어야 합니다.');
  }
}

@Injectable()
export class ArticlesService {
  constructor(
    private prisma: PrismaService,
    private notificationGateway: NotificationGateway,
  ) {}

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
      latitude: article.latitude,
      longitude: article.longitude,
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
        images: true,

        spaceship: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!article) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    return {
      ...article,
      likeCount: article.likes.length,
      isLiked: article.likes.some((like) => like.userId === userId),
      spaceshipName: article.spaceship?.name,
      latitude: article.latitude,
      longitude: article.longitude,
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
        latitude: article.latitude,
        longitude: article.longitude,
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
        latitude: article.latitude,
        longitude: article.longitude,
      })),
    };
  }

  private getDistanceFromLatLonInKm(
    centerLatitude,
    centerLongitude,
    latitude,
    longitude,
  ) {
    const deg2rad = (deg) => {
      return deg * (Math.PI / 180);
    };

    const R = 6371;
    const dLat = deg2rad(latitude - centerLatitude);
    const dLon = deg2rad(longitude - centerLongitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(centerLatitude)) *
        Math.cos(deg2rad(latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  }

  async getArticlesByLocation(
    userId: number,
    planetId: number,
    centerLatitude: number,
    centerLongitude: number,
    radius: number,
    page: number,
    limit: number,
    spaceshipName?: string,
  ) {
    const skip = (page - 1) * limit;
    const take = limit;

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
      include: {
        author: true,
        planet: true,
        likes: true,
        comments: true,
        images: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take,
    });

    const filteredArticles = articles.filter((article) => {
      const distance = this.getDistanceFromLatLonInKm(
        centerLatitude,
        centerLongitude,
        article.latitude,
        article.longitude,
      );
      return distance <= radius;
    });

    if (!filteredArticles.length) {
      throw new NotFoundException('해당 위치에 게시글이 없습니다.');
    }

    const paginatedArticles = filteredArticles.slice(skip, skip + take);

    return {
      total: filteredArticles.length,
      totalPages: Math.ceil(filteredArticles.length / limit),
      currentPage: page,
      articles: paginatedArticles.map(({ likes, comments, ...article }) => ({
        ...article,
        likeCount: likes.length,
        commentCount: comments.length,
        isLiked: likes.some((like) => like.userId === userId),
      })),
    };
  }

  async createArticle(dto: CreateArticleDto, userId: number) {
    validateArticle(dto);

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
        latitude: dto.latitude,
        longitude: dto.longitude,
        images:
          dto.imageUrls && dto.imageUrls.length > 0
            ? {
                create: dto.imageUrls.map((url) => ({ url })),
              }
            : undefined,
      },
      include: {
        images: true,
        author: true,
        planet: true,
        spaceship: true,
        likes: true,
        comments: true,
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    if (dto.planetId) {
      const planet = await this.prisma.planet.findUnique({
        where: { id: dto.planetId },
      });
      if (!planet) {
        throw new NotFoundException('행성을 찾을 수 없습니다.');
      }

      const membersOfPlanet = await this.prisma.planetMembership.findMany({
        where: { planetId: dto.planetId },
      });

      const membersToNotify = membersOfPlanet.filter(
        (member) => member.role !== PlanetMemberRole.GUEST,
      );

      for (const member of membersToNotify) {
        const content = `${planet.name}행성에 새로운 게시글이 올라왔어요.`;
        const notification = await this.prisma.notification.create({
          data: {
            userId: member.userId,
            content,
            userNickName: user.nickName,
            articleId: newArticle.id,
            planetId: dto.planetId,
            type: 'ARTICLE',
          },
        });

        this.notificationGateway.sendNotificationToPlanetMembers(
          member.userId,
          notification.id,
        );
      }
    }
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
    validateArticle(dto);

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
        spaceship: dto.spaceshipId
          ? { connect: { id: dto.spaceshipId } }
          : dto.spaceshipId === null
          ? { disconnect: true }
          : undefined,
        latitude: dto.latitude,
        longitude: dto.longitude,
        images:
          dto.imageUrls && dto.imageUrls.length > 0
            ? {
                create: dto.imageUrls.map((url) => ({ url })),
              }
            : undefined,
      },
      include: {
        images: true,
        author: true,
        planet: true,
        spaceship: true,
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

    return this.prisma.article.delete({
      where: { id },
    });
  }

  async getArticlesByAuthor(
    authorId: number,
    page: number,
    limit: number,
    title?: string,
    planetName?: string,
  ): Promise<{ articles: Article[]; totalCount: number }> {
    const skip = (page - 1) * limit;

    const whereClause = {
      authorId: authorId,
      title: title ? { contains: title } : undefined,
      planet: planetName
        ? {
            is: {
              name: { contains: planetName },
            },
          }
        : undefined,
    };

    const [articles, totalCount] = await Promise.all([
      this.prisma.article.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          author: true,
          planet: true,
          likes: true,
          comments: true,
          images: true,
        },
      }),
      this.prisma.article.count({
        where: whereClause,
      }),
    ]);

    return {
      articles: articles.map((article) => ({
        ...article,
        likeCount: article.likes.length,
        isLiked: article.likes.some((like) => like.userId === authorId),
        latitude: article.latitude,
        longitude: article.longitude,
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

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
      include: { planet: true },
    });

    if (!article) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    const newLike = await this.prisma.like.create({
      data: {
        userId: userId,
        articleId: articleId,
      },
    });

    const content = `${user.nickName} 님이 회원님의 게시글을 좋아해요.`;
    const notification = await this.prisma.notification.create({
      data: {
        userId: article.authorId,
        content,
        userNickName: user.nickName,
        articleId: articleId,
        planetId: article.planet?.id,
        type: 'LIKE',
      },
    });

    this.notificationGateway.sendNotificationToUser(
      article.authorId,
      notification.id,
    );

    return newLike;
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
  async getLikedArticles(
    userId: number,
    page: number,
    limit: number,
    title?: string,
  ) {
    const skip = (page - 1) * limit;
    const whereClause: any = {
      userId,
      article: {},
    };

    if (title) {
      whereClause.article.title = { contains: title };
    }

    const [likes, totalCount] = await Promise.all([
      this.prisma.like.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          article: {
            include: {
              planet: true,
              likes: true,
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
        where: whereClause,
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

    return this.prisma.article.delete({
      where: { id },
    });
  }
}
