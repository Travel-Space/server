import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ViewCountService {
  constructor(private prisma: PrismaService) {}

  async incrementViewCount(articleId: number | null, planetId: number | null) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const whereClause = {
      date: today,
      ...(articleId ? { articleId } : {}),
      ...(planetId ? { planetId } : {}),
    };

    const view = await this.prisma.viewCount.findFirst({
      where: whereClause,
    });

    if (view) {
      await this.prisma.viewCount.update({
        where: {
          id: view.id,
        },
        data: {
          count: {
            increment: 1,
          },
        },
      });
    } else {
      await this.prisma.viewCount.create({
        data: {
          date: today,
          articleId,
          planetId,
          count: 1,
        },
      });
    }
  }

  async getDailyViewCounts(
    planetId: number,
    from: Date,
    to: Date,
    page: number,
    pageSize: number = 20,
  ) {
    const skip = (page - 1) * pageSize;

    return this.prisma.viewCount.groupBy({
      by: ['date'],
      where: {
        planetId: planetId,
        date: {
          gte: from,
          lte: to,
        },
      },
      _sum: {
        count: true,
      },
      orderBy: {
        date: 'asc',
      },
      take: pageSize,
      skip: skip,
    });
  }

  async getWeeklyViewCounts(
    planetId: number,
    startWeek: Date,
    endWeek: Date,
    page: number,
    pageSize: number = 12,
  ) {
    const skip = (page - 1) * pageSize;

    const startOfStartWeek = this.getStartOfWeek(startWeek);
    const endOfEndWeek = this.getEndOfWeek(endWeek);

    return this.prisma.viewCount.groupBy({
      by: ['date'],
      where: {
        planetId: planetId,
        date: {
          gte: startOfStartWeek,
          lte: endOfEndWeek,
        },
      },
      _sum: {
        count: true,
      },
      orderBy: {
        date: 'asc',
      },
      take: pageSize,
      skip: skip,
    });
  }

  private getStartOfWeek(date: Date) {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setHours(0, 0, 0, 0);
    return new Date(date.setDate(diff));
  }

  private getEndOfWeek(date: Date) {
    const startOfWeek = this.getStartOfWeek(new Date(date));
    startOfWeek.setDate(startOfWeek.getDate() + 6);
    startOfWeek.setHours(23, 59, 59, 999);
    return new Date(startOfWeek);
  }

  async getTopArticlesByMonthlyViews(
    planetId: number,
    year: number,
    month: number,
  ) {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    const monthlyViewCounts = await this.prisma.viewCount.groupBy({
      by: ['articleId'],
      where: {
        planetId: planetId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        articleId: {
          not: null,
        },
      },
      _sum: {
        count: true,
      },
      orderBy: {
        _sum: {
          count: 'desc',
        },
      },
      take: 10,
    });

    const topArticles = await this.prisma.article.findMany({
      where: {
        id: {
          in: monthlyViewCounts.map((viewCount) => viewCount.articleId),
        },
      },
      include: {
        planet: true,
      },
    });

    return topArticles.map((article) => {
      const viewCount = monthlyViewCounts.find(
        (view) => view.articleId === article.id,
      );
      return {
        ...article,
        monthlyViews: viewCount?._sum.count || 0,
      };
    });
  }
}
