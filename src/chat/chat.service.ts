import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ChatMembership,
  ChatRoom,
  Message,
  Planet,
  Prisma,
  Spaceship,
} from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
type ChatRoomWithRelations = Prisma.ChatRoomGetPayload<{
  include: { chatMemberships: true; planet: true; spaceship: true };
}>;
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

  async listChatsForUser(userId: number): Promise<ChatRoomWithRelations[]> {
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
        planet: true,
        spaceship: true,
        chatMemberships: true,
      },
    });
  }

  async createMessage(chatRoomId: number, senderId: number, content: string) {
    const sender = await this.prisma.user.findUnique({
      where: { id: senderId },
      select: { nickName: true, profileImage: true },
    });

    if (!sender) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    const message = await this.prisma.message.create({
      data: {
        content,
        senderId,
        chatRoomId,
      },
      select: {
        id: true,
        content: true,
        senderId: true,
        chatRoomId: true,
        createdAt: true,
        sender: {
          select: {
            nickName: true,
            profileImage: true,
          },
        },
      },
    });

    return message;
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

  async updateMessage(messageId: number, content: string) {
    try {
      const updatedMessage = await this.prisma.message.update({
        where: {
          id: messageId,
        },
        data: {
          content,
        },
        select: {
          id: true,
          content: true,
          senderId: true,
          chatRoomId: true,
          createdAt: true,
          sender: {
            select: {
              nickName: true,
              profileImage: true,
            },
          },
        },
      });
      return updatedMessage;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async deleteMessage(messageId: number): Promise<Message | null> {
    try {
      const deletedMessage = await this.prisma.message.delete({
        where: {
          id: messageId,
        },
      });
      return deletedMessage;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async getMessagesByRoomId(roomId: string): Promise<Message[]> {
    return this.prisma.message.findMany({
      where: { chatRoomId: Number(roomId) },
      orderBy: { createdAt: 'asc' },
    });
  }
}
