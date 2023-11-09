import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NotificationService } from './notification.service';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['authorization', 'Authorization'],
    credentials: true,
  },
  namespace: /\/ws-.+/,
  transports: ['websocket', 'polling'],
})
export class NotificationGateway {
  @WebSocketServer() server: Server;

  constructor(private notificationService: NotificationService) {}

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
}