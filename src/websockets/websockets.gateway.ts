import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket, ...args: any[]) {
    console.log(`클라이언트와 연결되었습니다.: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`클라이언트와 연결이 끊어졌습니다: ${client.id}`);
  }

  @SubscribeMessage('chat')
  onChat(client: Socket, message: string): void {
    this.server.emit('chat', message);
  }

  @SubscribeMessage('notification')
  onNotification(client: Socket, data: any): void {
    client.emit('notification', data);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(client: Socket, room: string) {
    client.join(room);
    client.emit('joinedRoom', room);
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(client: Socket, room: string) {
    client.leave(room);
    client.emit('leftRoom', room);
  }

  @SubscribeMessage('sendMessage')
  handleMessage(
    @MessageBody() message: { room: string; text: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.server.to(message.room).emit('newMessage', message.text);
  }
}
