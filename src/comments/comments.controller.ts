import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { CreateCommentDto, UpdateCommentDto } from 'src/articles/dto';
import { JwtAuthGuard, LoggedInGuard } from 'src/auth/guard';
import { CommentsService } from './comments.service';

ApiTags('댓글 API');
@Controller('comments')
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @UseGuards(JwtAuthGuard, LoggedInGuard)
  @Put(':commentId')
  @ApiOperation({
    summary: '댓글 수정 API',
    description: '게시글의 댓글 내용을 수정합니다.',
  })
  @ApiBody({ type: UpdateCommentDto })
  async updateComment(
    @Param('commentId', ParseIntPipe) commentId: number, // ParseIntPipe 추가
    @Body() updateCommentDto: UpdateCommentDto,
    @Req() req: any,
  ) {
    const userId = req.user.userId;
    const updatedComment = await this.commentsService.updateComment(
      commentId,
      updateCommentDto,
      userId,
    );
    return updatedComment; // res 사용 제거
  }

  @UseGuards(JwtAuthGuard, LoggedInGuard)
  @Post(':articleId/comments')
  @ApiOperation({
    summary: '댓글 작성 API',
    description: '게시글에 댓글 혹은 대댓글을 작성합니다.',
  })
  @ApiBody({ type: CreateCommentDto })
  async createComment(
    @Param('articleId', ParseIntPipe) articleId: number, // ParseIntPipe 추가
    @Body() createCommentDto: CreateCommentDto,
    @Req() req: any,
  ) {
    const userId = req.user.userId;
    const comment = await this.commentsService.createComment(
      createCommentDto,
      userId,
      articleId,
    );
    return comment; // res 사용 제거
  }
}
