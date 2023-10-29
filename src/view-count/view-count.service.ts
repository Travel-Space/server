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

    let view = await this.prisma.viewCount.findFirst({
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
  async getWeeklyViewCount(articleId: number | null, planetId: number | null) {
    const startOfWeek = this.getStartOfWeek(new Date());
    const endOfWeek = this.getEndOfWeek(new Date());

    return await this.prisma.viewCount.groupBy({
      by: ['articleId', 'planetId'],
      where: {
        AND: [
          { date: { gte: startOfWeek } },
          { date: { lte: endOfWeek } },
          articleId ? { articleId } : undefined,
          planetId ? { planetId } : undefined,
        ],
      },
      _sum: {
        count: true,
      },
    });
  }

  private getStartOfWeek(date: Date) {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  }

  private getEndOfWeek(date: Date) {
    const startOfWeek = this.getStartOfWeek(date);
    return new Date(startOfWeek.setDate(startOfWeek.getDate() + 6));
  }
}
