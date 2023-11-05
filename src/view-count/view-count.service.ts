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
    pageSize: number,
  ) {
    const viewCounts = await this.prisma.viewCount.findMany({
      where: {
        planetId: planetId,
        date: {
          gte: from,
          lte: to,
        },
      },
      orderBy: {
        date: 'asc',
      },

      take: pageSize,
    });

    return viewCounts;
  }

  getStartOfWeek(date: Date) {
    const startOfWeek = new Date(date);
    startOfWeek.setUTCHours(15, 0, 0, 0);
    startOfWeek.setUTCDate(startOfWeek.getUTCDate() - startOfWeek.getUTCDay());
    return startOfWeek;
  }

  getEndOfWeek(date: Date) {
    const endOfWeek = new Date(this.getStartOfWeek(date));
    endOfWeek.setUTCDate(endOfWeek.getUTCDate() + 6);
    endOfWeek.setUTCHours(14, 59, 59, 999);
    return endOfWeek;
  }

  async getWeeklyViewCounts(
    planetId: number,
    startWeek: Date,
    endWeek: Date,
    page: number,
  ) {
    const skip = (page - 1) * 12;
    const weeks = [];

    for (let i = 0; i < 12; i++) {
      const weekStart = new Date(
        startWeek.getTime() - i * 7 * 24 * 60 * 60 * 1000,
      );
      const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);

      const viewCounts = await this.prisma.viewCount.groupBy({
        by: ['date'],
        where: {
          planetId: planetId,
          date: {
            gte: weekStart,
            lte: new Date(weekEnd.getTime() + 24 * 60 * 60 * 1000 - 1),
          },
        },
        _sum: {
          count: true,
        },
      });

      const count = viewCounts.reduce(
        (acc, curr) => acc + (curr._sum.count || 0),
        0,
      );

      weeks.unshift({
        start: weekStart.toISOString(),
        end: weekEnd.toISOString(),
        count: count,
      });
    }

    return weeks;
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
