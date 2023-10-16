import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArticleDto, UpdateArticleDto } from './dto';

@Injectable()
export class ArticlesService {
  constructor(private prisma: PrismaService) {}

  async createArticle(data: CreateArticleDto, userId: number) {
    return this.prisma.article.create({
      data: {
        ...data,
        authorId: userId,
      },
    });
  }

  async updateArticle(id: number, data: UpdateArticleDto) {
    return this.prisma.article.update({
      where: { id },
      data,
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
}
