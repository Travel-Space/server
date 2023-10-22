import {
  Controller,
  Post,
  Body,
  Req,
  Put,
  Param,
  UseGuards,
  Res,
  Delete,
  Get,
  Query,
  UsePipes,
  ValidationPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { ArticlesService } from './articles.service';
import {
  CreateArticleDto,
  CreateCommentDto,
  UpdateArticleDto,
  UpdateCommentDto,
  FindArticlesByPlanetDto,
} from './dto';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';

@ApiTags('게시글 API')
@Controller('articles')
export class ArticlesController {
  constructor(private articlesService: ArticlesService) {}

  @ApiOperation({
    summary: '모든 게시글 조회 API',
    description: '모든 게시글을 불러온다',
  })
  @ApiResponse({
    status: 201,
    description: '게시글을 모두 불러왔습니다.',
    type: String,
  })
  @Get()
  async getAllArticles(@Req() req: any) {
    return this.articlesService.getAllArticles(req.user.userId);
  }

  @ApiOperation({
    summary: '행성의 게시글 조회 API',
    description: '행성의 모든 게시글을 불러온다.',
  })
  @ApiResponse({
    status: 201,
    description: '행성의 게시글을 모두 불러왔습니다.',
    type: String,
  })
  @ApiQuery({
    name: 'planetId',
    required: true,
    type: Number,
    description: '조회하려는 행성의 ID',
  })
  @Get('byPlanet')
  @UsePipes(ValidationPipe)
  async getArticlesByPlanet(
    @Req() req: any,
    @Query('planetId') planetId: number,
  ) {
    return this.articlesService.getArticlesByPlanetId(
      planetId,
      req.user.userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({
    summary: '게시글 작성 API',
    description: '새로운 게시글을 작성한다.',
  })
  @ApiResponse({
    status: 201,
    description: '게시글 작성이 완료되었습니다.',
    type: String,
  })
  @ApiBody({ type: CreateArticleDto })
  async createArticle(
    @Body() createArticleDto: CreateArticleDto,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = req.user.userId;
    const planetId = createArticleDto.planetId;

    if (!(await this.articlesService.isUserToPlanet(userId, planetId))) {
      return res
        .status(403)
        .json({ message: '사용자는 해당 행성의 멤버가 아닙니다.' });
    }

    const article = await this.articlesService.createArticle(
      createArticleDto,
      userId,
    );
    return res.status(201).json(article);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @ApiOperation({
    summary: '게시글 업데이트 API',
    description: '게시글 내용을 업데이트한다.',
  })
  @ApiResponse({
    status: 200,
    description: '게시글 업데이트가 완료되었습니다.',
    type: String,
  })
  @ApiBody({ type: UpdateArticleDto })
  async updateArticle(
    @Param('id') id: number,
    @Body() updateArticleDto: UpdateArticleDto,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = req.user.userId;
    const updatedArticle = await this.articlesService.updateArticle(
      id,
      updateArticleDto,
      userId,
    );
    return res.json(updatedArticle);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({
    summary: '게시글 삭제 API',
    description: '게시글을 삭제합니다.',
  })
  async deleteArticle(
    @Param('id') id: number,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = req.user.userId;
    await this.articlesService.deleteArticle(id, userId);
    return res.status(204).send();
  }

  @UseGuards(JwtAuthGuard)
  @Post(':articleId/comments')
  @ApiOperation({
    summary: '댓글 작성 API',
    description: '게시글에 댓글 혹은 대댓글을 작성합니다.',
  })
  @ApiBody({ type: CreateCommentDto })
  async createComment(
    @Param('articleId') articleId: number,
    @Body() createCommentDto: CreateCommentDto,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = req.user.userId;
    const comment = await this.articlesService.createComment(
      createCommentDto,
      userId,
      articleId,
    );
    return res.status(201).json(comment);
  }

  @UseGuards(JwtAuthGuard)
  @Put('comments/:commentId')
  @ApiOperation({
    summary: '댓글 수정 API',
    description: '게시글의 댓글 내용을 수정합니다.',
  })
  @ApiBody({ type: UpdateCommentDto })
  async updateComment(
    @Param('commentId') commentId: number,
    @Body() updateCommentDto: UpdateCommentDto,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = req.user.userId;
    const updatedComment = await this.articlesService.updateComment(
      commentId,
      updateCommentDto,
      userId,
    );
    return res.json(updatedComment);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-articles')
  @ApiOperation({
    summary: '내 게시글 조회 API',
    description: '로그인한 사용자의 게시글을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '내 게시글을 모두 불러왔습니다.',
    type: String,
  })
  async getUserArticles(@Req() req: any) {
    return this.articlesService.getArticlesByAuthor(
      req.user.userId,
      req.user.userId,
    );
  }
  @UseGuards(JwtAuthGuard)
  @Post(':articleId/like')
  @ApiOperation({
    summary: '게시글 좋아요 API',
    description: '게시글에 좋아요를 추가합니다.',
  })
  @ApiParam({ name: 'articleId', description: '게시글의 고유 ID' })
  async addLike(
    @Req() req: any,
    @Param('articleId', ParseIntPipe) articleId: number,
  ) {
    return await this.articlesService.addLike(req.user.userId, articleId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':articleId/like')
  @ApiOperation({
    summary: '게시글 좋아요 취소 API',
    description: '게시글의 좋아요를 취소합니다.',
  })
  @ApiParam({ name: 'articleId', description: '게시글의 고유 ID' })
  async removeLike(
    @Req() req: any,
    @Param('articleId', ParseIntPipe) articleId: number,
  ) {
    return await this.articlesService.removeLike(req.user.userId, articleId);
  }
}
