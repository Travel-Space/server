import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async createNotification(content: string, userId: number) {
    return this.prisma.notification.create({
      data: {
        content,
        userId,
      },
    });
  }

  async getNotificationsForUser(userId: number) {
    return this.prisma.notification.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async deleteNotification(notificationId: number) {
    return this.prisma.notification.delete({
      where: {
        id: notificationId,
      },
    });
  }
}
