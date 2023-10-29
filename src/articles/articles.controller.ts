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
  NotFoundException,
  DefaultValuePipe,
} from '@nestjs/common';
import { Response } from 'express';
import { ArticlesService } from './articles.service';
import { CreateArticleDto, UpdateArticleDto } from './dto';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminGuard, JwtAuthGuard, LoggedInGuard } from 'src/auth/guard';
import { ArticleGuard } from './guard';
import { ViewCountService } from '../view-count/view-count.service';

@ApiTags('게시글 API')
@Controller('articles')
export class ArticlesController {
  constructor(
    private articlesService: ArticlesService,
    private viewCountService: ViewCountService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({
    summary: '모든 게시글 조회 API',
    description: '모든 게시글을 페이지네이션하여 반환합니다.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: 'number',
    description: '페이지 번호',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    description: '한 페이지당 게시글 수',
  })
  async getAllArticles(
    @Req() req: any,
    @Query('page', ParseIntPipe) page: number = 1,
  ) {
    const userId = req.user.userId;
    return this.articlesService.getAllArticles(userId, page);
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
  @UseGuards(JwtAuthGuard, ArticleGuard)
  async getArticlesByPlanet(
    @Req() req: any,
    @Query('planetId') planetId: number,
  ) {
    return this.articlesService.getArticlesByPlanetId(
      planetId,
      req.user.userId,
    );
  }

  @ApiOperation({
    summary: '특정 게시글 조회 API',
    description: '특정 게시글을 불러온다',
  })
  @ApiResponse({
    status: 201,
    description: '게시글을 불러왔습니다.',
    type: String,
  })
  @Get(':id')
  @UseGuards(JwtAuthGuard, ArticleGuard)
  async getArticleById(@Param('id') articleId: number, @Req() req: any) {
    const userId = req.user.id;
    await this.viewCountService.incrementViewCount(articleId, null);
    const article = await this.articlesService.getArticleById(
      articleId,
      userId,
    );
    if (!article) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }
    return article;
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

    console.log('userid' + userId, 'planetId' + planetId);
    if (
      planetId &&
      !(await this.articlesService.isUserToPlanet(userId, planetId))
    ) {
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

  @UseGuards(JwtAuthGuard, LoggedInGuard)
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

  @UseGuards(JwtAuthGuard, LoggedInGuard)
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

  @UseGuards(JwtAuthGuard, LoggedInGuard)
  @Get('my/articles')
  @ApiOperation({
    summary: '내 게시글 조회 API',
    description: '로그인한 사용자의 게시글을 페이지네이션하여 조회합니다.',
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    description: '페이지 번호',
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    description: '페이지당 게시글 수',
    required: false,
  })
  async getUserArticles(
    @Req() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.articlesService.getArticlesByAuthor(
      req.user.userId,
      page,
      limit,
    );
  }

  @UseGuards(JwtAuthGuard, LoggedInGuard)
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

  @UseGuards(JwtAuthGuard, LoggedInGuard)
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

  @UseGuards(JwtAuthGuard, LoggedInGuard)
  @Get('likes')
  @ApiOperation({
    summary: '내가 좋아요 누른 게시글 조회 API',
    description: '사용자가 좋아요를 누른 게시글 목록을 조회합니다.',
  })
  async getMyLikedArticles(@Req() req: any) {
    const userId = req.user.userId;
    return this.articlesService.getLikedArticles(userId);
  }
}
