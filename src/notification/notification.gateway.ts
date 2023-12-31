import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NotificationService } from './notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: 'https://travelspace.world',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['authorization', 'Authorization'],
    credentials: true,
  },
  namespace: /\/ws-notifications-.+/,
  transports: ['websocket', 'polling'],
})
export class NotificationGateway {
  @WebSocketServer() server: Server;

  constructor(
    private notificationService: NotificationService,
    private prisma: PrismaService,
  ) {}

  @SubscribeMessage('subscribeToNotifications')
  async handleSubscribeToNotifications(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: number },
  ): Promise<void> {
    const notifications =
      await this.notificationService.getNotificationsForUser(data.userId);
    client.join(data.userId.toString());
    client.emit('notifications', notifications);
  }

  async sendNotificationToUser(userId: number, notificationId: number) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    const notificationData = {
      id: notification.id,
      content: notification.content,
      articleId: notification.articleId,
      invitationId: notification.invitationId,
      planetId: notification.planetId,
      type: notification.type,
    };

    this.server.emit('notifications', notificationData);
  }

  async sendLikeNotificationToUser(likerId: number, articleId: number) {
    const notification = await this.notificationService.notifyUserAboutLike(
      likerId,
      articleId,
    );

    this.server
      .to(notification.userId.toString())
      .emit('notifications', notification);
  }

  async sendNotificationToPlanetMembers(
    userId: number,
    notificationId: number,
  ) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    const notificationData = {
      id: notification.id,
      content: notification.content,
      articleId: notification.articleId,
      type: notification.type,
    };

    this.server.emit('notifications', notificationData);
    // this.server.to(userId.toString()).emit('notification', notificationData);
  }
}
