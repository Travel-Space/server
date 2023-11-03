import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway()
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
}
