import { Injectable } from '@nestjs/common';
import { ChatRoom, Message } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async createChatRoom(userIds: number[]): Promise<ChatRoom> {
    const chatRoom = await this.prisma.chatRoom.create({
      data: {
        chatMemberships: {
          createMany: {
            data: userIds.map((userId) => ({ userId })),
            skipDuplicates: true,
          },
        },
      },
      include: {
        chatMemberships: true,
      },
    });
    return chatRoom;
  }

  async listChatsForUser(userId: number): Promise<ChatRoom[]> {
    return await this.prisma.chatRoom.findMany({
      where: {
        chatMemberships: {
          some: {
            userId,
          },
        },
      },
      include: {
        messages: true,
      },
    });
  }

  async createMessage(
    chatRoomId: number,
    senderId: number,
    content: string,
  ): Promise<Message> {
    return await this.prisma.message.create({
      data: {
        content,
        senderId,
        chatRoomId,
      },
    });
  }

  async getMessagesFromChat(chatRoomId: number): Promise<Message[]> {
    return await this.prisma.message.findMany({
      where: {
        chatRoomId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
