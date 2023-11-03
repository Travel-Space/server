import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { CreateMessageDto } from './dto';
import { JwtAuthGuard, LoggedInGuard } from 'src/auth/guard';
import { ChatService } from './chat.service';

@ApiTags('채팅 API')
@Controller('chats')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @UseGuards(JwtAuthGuard, LoggedInGuard)
  @Post('create')
  @ApiOperation({
    summary: '채팅방 생성 API',
    description: '새로운 채팅방을 생성합니다.',
  })
  async createChatRoom(@Body() body: { userIds: number[] }, @Req() req: any) {
    const userId = req.user.userId;
    return this.chatService.createChatRoom([...body.userIds, userId]);
  }

  @UseGuards(JwtAuthGuard, LoggedInGuard)
  @Get()
  @ApiOperation({
    summary: '사용자 채팅방 목록 조회 API',
    description: '사용자가 속한 채팅방 목록을 조회합니다.',
  })
  async listChatsForUser(@Req() req: any) {
    const userId = req.user.userId;
    return this.chatService.listChatsForUser(userId);
  }

  @UseGuards(JwtAuthGuard, LoggedInGuard)
  @Get(':chatId/messages')
  @ApiOperation({
    summary: '채팅방 메시지 조회 API',
    description: '특정 채팅방의 메시지를 조회합니다.',
  })
  async getMessagesFromChat(@Param('chatId', ParseIntPipe) chatId: number) {
    return this.chatService.getMessagesFromChat(chatId);
  }

  @UseGuards(JwtAuthGuard, LoggedInGuard)
  @Post(':chatId/messages')
  @ApiOperation({
    summary: '채팅 메시지 전송 API',
    description: '채팅방에 메시지를 전송합니다.',
  })
  @ApiBody({ type: CreateMessageDto })
  async createMessage(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Body() createMessageDto: CreateMessageDto,
    @Req() req: any,
  ) {
    const userId = req.user.userId;
    return this.chatService.createMessage(
      chatId,
      userId,
      createMessageDto.content,
    );
  }
}
