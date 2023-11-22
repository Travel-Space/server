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
  namespace: /\/ws-chat-.+/,
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

  @SubscribeMessage('getUserRooms')
  async handleGetUserRooms(
    @MessageBody() userId: number,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const rooms = await this.chatService.listChatsForUser(userId);
      const roomsWithDetails = await Promise.all(
        rooms.map(async (room) => {
          const members = room.chatMemberships.map((membership) => {
            const planetMembership = room.planet
              ? room.planet.members.find(
                  (member) => member.userId === membership.userId,
                )
              : null;
            const spaceshipMember = room.spaceship
              ? room.spaceship.members.find(
                  (member) => member.userId === membership.userId,
                )
              : null;
            return {
              nickname: membership.user.nickName,
              profileImage: membership.user.profileImage,
              role: planetMembership
                ? planetMembership.role
                : spaceshipMember
                ? spaceshipMember.role
                : null,
              joinedAt: planetMembership
                ? planetMembership.joinedAt
                : spaceshipMember
                ? spaceshipMember.joinedAt
                : null,
            };
          });

          members.sort((a, b) => {
            if (a.role === 'OWNER') return -1;
            if (b.role === 'OWNER') return 1;
            if (a.joinedAt < b.joinedAt) return -1;
            if (a.joinedAt > b.joinedAt) return 1;
            return 0;
          });

          const messages = await this.chatService.getMessagesByRoomId(
            room.id.toString(),
          );

          return {
            ...room,
            totalMembers: room.chatMemberships.length,
            members,
            maxMembers: room.planet
              ? room.planet.memberLimit
              : room.spaceship
              ? room.spaceship.maxMembers
              : null,
            messages,
          };
        }),
      );
      client.emit('userRooms', roomsWithDetails);
    } catch (error) {
      client.emit('error', '채팅방을 받아오는데 실패하였습니다.');
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: { roomId: string; type: string },
    @ConnectedSocket() client: Socket,
  ) {
    const roomPrefix = data.type === 'planet' ? 'planet-' : 'spaceship-';
    const roomName = roomPrefix + data.roomId;

    client.join(roomName);
    console.log(
      ` ${client.id} 자동으로 ${data.type} 채팅방에 입장하였습니다. ID: ${data.roomId}`,
    );

    const messages = await this.chatService.getMessagesByRoomId(data.roomId);
    client.emit('roomHistory', messages);
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
    this.server.emit('newMessage', message);
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
