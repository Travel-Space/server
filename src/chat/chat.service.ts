import { Injectable } from '@nestjs/common';
import { Chat, Message } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async createChatRoom(userIds: number[]): Promise<Chat> {
    const chat = await this.prisma.chat.create({
      data: {
        chatMemberships: {
          createMany: {
            data: userIds.map((userId) => ({
              userId,
            })),
          },
        },
      },
      include: {
        chatMemberships: true,
      },
    });
    return chat;
  }

  async listChatsForUser(userId: number): Promise<Chat[]> {
    return await this.prisma.chat.findMany({
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
    chatId: number,
    senderId: number,
    content: string,
  ): Promise<Message> {
    return await this.prisma.message.create({
      data: {
        content,
        senderId,
        chatId,
      },
    });
  }

  async getMessagesFromChat(chatId: number): Promise<Message[]> {
    return await this.prisma.message.findMany({
      where: {
        chatId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
