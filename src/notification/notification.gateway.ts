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

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['authorization', 'Authorization'],
    credentials: true,
  },
  namespace: /\/ws-notification-.+/,
  transports: ['websocket', 'polling'],
})
export class NotificationGateway {
  @WebSocketServer() server: Server;

  constructor(
    private notificationService: NotificationService,
    private prisma: PrismaService,
  ) {}

  @SubscribeMessage('createNotification')
  async handleCreateNotification(
    @MessageBody() data: { userId: number; content: string },
  ): Promise<void> {
    const notification = await this.notificationService.createNotification(
      data.content,
      data.userId,
    );
    this.server.to(data.userId.toString()).emit('notification', notification);
  }

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

  @SubscribeMessage('deleteNotification')
  async handleDeleteNotification(
    @MessageBody() data: { notificationId: number; userId: number },
  ): Promise<void> {
    await this.notificationService.deleteNotification(data.notificationId);
    this.server
      .to(data.userId.toString())
      .emit('notificationDeleted', data.notificationId);
  }

  async sendNotificationToUser(
    userId: number,
    articleId: number,
    commentContent: string,
  ) {
    const notification = await this.notificationService.notifyUserAboutComment(
      userId,
      articleId,
      commentContent,
    );

    this.server.to(userId.toString()).emit('notification', notification);
  }

  async sendLikeNotificationToUser(likerId: number, articleId: number) {
    const notification = await this.notificationService.notifyUserAboutLike(
      likerId,
      articleId,
    );

    this.server
      .to(notification.userId.toString())
      .emit('notification', notification);
  }

  async sendNotificationToPlanetMembers(
    userId: number,
    notificationId: number,
  ) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
      include: { article: true },
    });

    this.server.to(userId.toString()).emit('notification', {
      ...notification,
      articleId: notification.article.id,
    });
  }

  async sendCommentNotificationToUser(
    commentAuthorId: number,
    content: string,
  ) {
    const notification = await this.notificationService.createNotification(
      content,
      commentAuthorId,
    );
    this.server
      .to(commentAuthorId.toString())
      .emit('notification', notification);
  }
}
