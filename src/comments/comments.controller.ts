import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { CreateCommentDto, UpdateCommentDto } from './dto';
import { AdminGuard, JwtAuthGuard, LoggedInGuard } from 'src/auth/guard';
import { CommentsService } from './comments.service';

@ApiTags('댓글 API')
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
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body() updateCommentDto: UpdateCommentDto,
    @Req() req: any,
  ) {
    const userId = req.user.userId;
    const updatedComment = await this.commentsService.updateComment(
      commentId,
      updateCommentDto,
      userId,
    );
    return updatedComment;
  }

  @UseGuards(JwtAuthGuard, LoggedInGuard)
  @Post(':articleId/comments')
  @ApiOperation({
    summary: '댓글 작성 API',
    description: '게시글에 댓글 혹은 대댓글을 작성합니다.',
  })
  @ApiBody({ type: CreateCommentDto })
  async createComment(
    @Param('articleId', ParseIntPipe) articleId: number,
    @Body() createCommentDto: CreateCommentDto,
    @Req() req: any,
  ) {
    const userId = req.user.userId;
    const comment = await this.commentsService.createComment(
      createCommentDto,
      userId,
      articleId,
    );
    return comment;
  }

  @UseGuards(JwtAuthGuard, LoggedInGuard)
  @Get('user')
  @ApiOperation({
    summary: '사용자 댓글 조회 API',
    description: '사용자가 작성한 댓글을 조회합니다.',
  })
  async getUserComments(@Req() req: any) {
    const userId = req.user.userId;
    return this.commentsService.getCommentsByUserId(userId);
  }

  @UseGuards(JwtAuthGuard, LoggedInGuard)
  @Delete(':commentId')
  @ApiOperation({
    summary: '댓글 삭제 API',
    description: '사용자가 작성한 댓글을 삭제합니다.',
  })
  async deleteComment(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Req() req: any,
  ) {
    const userId = req.user.userId;
    await this.commentsService.deleteComment(commentId, userId);
    return {
      statusCode: HttpStatus.OK,
      message: '댓글이 성공적으로 삭제되었습니다.',
    };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':commentId')
  @ApiOperation({
    summary: '관리자 댓글 삭제 API',
    description: '관리자가 선택한 댓글을 삭제합니다.',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCommentByAdmin(
    @Param('commentId') commentId: number,
    @Req() req: any,
  ) {
    await this.commentsService.deleteComment(commentId, req.user.userId);
    return {
      statusCode: HttpStatus.NO_CONTENT,
      message: '댓글이 성공적으로 삭제되었습니다.',
    };
  }
}
