import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

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
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(private chatService: ChatService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() roomId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(roomId);
    console.log(`Client ${client.id} joined room ${roomId}`);
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @MessageBody() roomId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(roomId);
    console.log(`Client ${client.id} left room ${roomId}`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody()
    data: { chatRoomId: number; senderId: number; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    const message = await this.chatService.createMessage(
      data.chatRoomId,
      data.senderId,
      data.content,
    );
    this.server.to(data.chatRoomId.toString()).emit('newMessage', message);
    console.log(`Message sent to room ${data.chatRoomId}: ${data.content}`);
  }

  @SubscribeMessage('updateMessage')
  async handleUpdateMessage(
    @MessageBody() data: { messageId: number; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    const updatedMessage = await this.chatService.updateMessage(
      data.messageId,
      data.content,
    );

    if (updatedMessage) {
      this.server.emit('messageUpdated', updatedMessage);
      console.log(`Message updated: ${data.messageId}`);
    } else {
      client.emit(
        'updateMessageFailed',
        `Failed to update message: ${data.messageId}`,
      );
    }
  }

  @SubscribeMessage('deleteMessage')
  async handleDeleteMessage(
    @MessageBody() messageId: number,
    @ConnectedSocket() client: Socket,
  ) {
    const deletedMessage = await this.chatService.deleteMessage(messageId);

    if (deletedMessage) {
      this.server.emit('messageDeleted', messageId);
      console.log(`Message deleted: ${messageId}`);
    } else {
      client.emit(
        'deleteMessageFailed',
        `Failed to delete message: ${messageId}`,
      );
    }
  }
}
