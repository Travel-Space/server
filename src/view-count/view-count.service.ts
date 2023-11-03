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
  ) {
    const skip = (page - 1) * 12;

    const weeklyViewCounts = await this.prisma.viewCount.groupBy({
      by: ['date'],
      where: {
        planetId: planetId,
        date: {
          gte: startWeek,
          lte: endWeek,
        },
      },
      _sum: {
        count: true,
      },
      orderBy: {
        date: 'asc',
      },
      take: 12,
      skip: skip,
    });

    const weeklyViews = weeklyViewCounts.map((viewCount) => ({
      date: viewCount.date,
      count: viewCount._sum.count,
    }));

    const weeks = [];
    const currentWeek = new Date(endWeek.getTime());
    for (let i = 0; i < 12; i++) {
      const startOfWeek = this.getStartOfWeek(
        new Date(currentWeek.getTime() - i * 7 * 24 * 60 * 60 * 1000),
      );
      const endOfWeek = this.getEndOfWeek(
        new Date(currentWeek.getTime() - i * 7 * 24 * 60 * 60 * 1000),
      );
      const weekData = {
        start: startOfWeek,
        end: endOfWeek,
        count: weeklyViews[i]?.count || 0,
      };
      weeks.unshift(weekData);
    }

    return weeks;
  }

  getStartOfWeek(date: Date) {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  }

  getEndOfWeek(date: Date) {
    const endOfWeek = new Date(date);
    endOfWeek.setDate(date.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    return endOfWeek;
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
