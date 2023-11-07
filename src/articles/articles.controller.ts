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
import {
  ArticleWithCommentsDto,
  CreateArticleDto,
  UpdateArticleDto,
} from './dto';
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
import { CommentsService } from 'src/comments/comments.service';

@ApiTags('게시글 API')
@Controller('articles')
export class ArticlesController {
  constructor(
    private articlesService: ArticlesService,
    private viewCountService: ViewCountService,
    private commentsService: CommentsService,
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
  @ApiQuery({
    name: 'planetName',
    required: false,
    type: 'string',
    description: '검색할 행성 이름',
  })
  @ApiQuery({
    name: 'authorNickname',
    required: false,
    type: 'string',
    description: '검색할 작성자 닉네임',
  })
  @ApiQuery({
    name: 'title',
    required: false,
    type: 'string',
    description: '검색할 게시글 제목',
  })
  async getAllArticles(
    @Req() req: any,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
    @Query('planetName') planetName?: string,
    @Query('authorNickname') authorNickname?: string,
    @Query('title') title?: string,
  ) {
    const userId = req.user.userId;
    return this.articlesService.getAllArticles(
      userId,
      page,
      limit,
      planetName,
      authorNickname,
      title,
    );
  }

  @Get('byPlanet')
  @UsePipes(ValidationPipe)
  @UseGuards(JwtAuthGuard, ArticleGuard)
  @ApiOperation({
    summary: '행성의 게시글 조회 API',
    description: '행성의 모든 게시글을 페이지네이션하여 불러온다.',
  })
  @ApiQuery({
    name: 'planetId',
    required: true,
    type: Number,
    description: '조회하려는 행성의 ID',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: '페이지 번호',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '한 페이지당 게시글 수',
  })
  @ApiQuery({
    name: 'spaceshipName',
    required: false,
    type: String,
    description: '조회하려는 우주선의 이름',
  })
  async getArticlesByPlanet(
    @Req() req: any,
    @Query('planetId') planetId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('spaceshipName') spaceshipName?: string,
  ) {
    if (!page || !limit) {
      return this.articlesService.getAllArticlesByPlanetId(
        planetId,
        req.user.userId,
      );
    }

    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);

    return this.articlesService.getArticlesByPlanetId(
      planetId,
      req.user.userId,
      parsedPage,
      parsedLimit,
      spaceshipName,
    );
  }

  @Get('byLocation')
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseGuards(JwtAuthGuard)
  async getArticlesByLocation(
    @Req() req: any,
    @Query('planetId', ParseIntPipe) planetId: number,
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('radius') radius: number,
    @Query('spaceshipName') spaceshipName?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
  ) {
    if (radius <= 0) {
      throw new Error('반경은 0보다 커야 합니다.');
    }
    if (latitude < -90 || latitude > 90) {
      throw new Error('위도는 -90과 90 사이의 값이어야 합니다.');
    }
    if (longitude < -180 || longitude > 180) {
      throw new Error('경도는 -180과 180 사이의 값이어야 합니다.');
    }

    return this.articlesService.getArticlesByLocation(
      req.user.userId,
      planetId,
      latitude,
      longitude,
      radius,
      page,
      limit,
      spaceshipName,
    );
  }

  @ApiOperation({
    summary: '특정 게시글 조회 API',
    description: '특정 게시글과 관련된 주 댓글 및 초기 대댓글을 불러온다',
  })
  @ApiResponse({
    status: 200,
    description: '게시글, 주 댓글, 및 초기 대댓글을 불러왔습니다.',
    type: ArticleWithCommentsDto,
  })
  @ApiQuery({
    name: 'commentPage',
    required: false,
    type: Number,
    description: '댓글 페이지 번호',
    example: 1,
  })
  @ApiQuery({
    name: 'commentPageSize',
    required: false,
    type: Number,
    description: '댓글 페이지 크기',
    example: 10,
  })
  @ApiQuery({
    name: 'replyPageSize',
    required: false,
    type: Number,
    description: '대댓글 페이지 크기',
    example: 5,
  })
  @Get(':id')
  @UseGuards(JwtAuthGuard, ArticleGuard)
  async getArticleWithComments(
    @Param('id', ParseIntPipe) articleId: number,
    @Query('commentPage', ParseIntPipe) commentPage: number,
    @Query('commentPageSize', ParseIntPipe) commentPageSize: number,
    @Query('replyPageSize', ParseIntPipe) replyPageSize: number,
    @Req() req: any,
  ) {
    const userId = req.user.userId;

    const article = await this.articlesService.getArticleById(
      articleId,
      userId,
    );
    if (!article) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    await this.viewCountService.incrementViewCount(articleId, article.planetId);

    const { comments: topLevelComments, totalTopLevelCommentsCount } =
      await this.commentsService.getComments(
        articleId,
        commentPage,
        commentPageSize,
      );

    const commentsWithInitialReplies = await Promise.all(
      topLevelComments.map(async (comment) => {
        const initialReplies = await this.commentsService.getMoreChildComments(
          comment.id,
          null,
          replyPageSize,
        );
        return {
          ...comment,
          replies: initialReplies.map((reply) => ({
            ...reply,
            authorProfileImage: reply.author.profileImage,
            authorNationality: reply.author.nationality,
            authorNickName: reply.author.nickName,
          })),
          repliesCount: comment._count.children,
        };
      }),
    );

    return {
      ...article,
      comments: commentsWithInitialReplies,
      totalTopLevelCommentsCount,
    };
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

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete('admin/:id')
  @ApiOperation({
    summary: '관리자에 의한 게시글 삭제 API',
    description: '관리자가 게시글을 삭제합니다.',
  })
  async deleteArticleByAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.articlesService.deleteArticleByAdmin(id);
    return res.status(204).send();
  }

  @UseGuards(JwtAuthGuard, LoggedInGuard)
  @Get('my/articles')
  @ApiOperation({
    summary: '내 게시글 조회 API',
    description:
      '로그인한 사용자의 게시글을 페이지네이션하여 조회하고, 전체 페이지 수를 반환합니다.',
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
    const { articles, totalCount } =
      await this.articlesService.getArticlesByAuthor(
        req.user.userId,
        page,
        limit,
      );
    return {
      data: articles,
      page,
      limit,
      totalCount,
    };
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
  @Get('my/likes')
  @ApiOperation({
    summary: '내가 좋아요 누른 게시글 조회 API',
    description:
      '사용자가 좋아요를 누른 게시글 목록을 페이지네이션하여 조회합니다.',
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: false,
    description: '페이지 번호',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: '페이지당 게시글 수',
  })
  async getMyLikedArticles(
    @Req() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const { likedArticles, totalCount } =
      await this.articlesService.getLikedArticles(req.user.userId, page, limit);
    return {
      data: likedArticles,
      page,
      limit,
      totalCount,
    };
  }

  @UseGuards(JwtAuthGuard, LoggedInGuard)
  @Get(':planetId/top-articles')
  @ApiOperation({
    summary: '행성별 월간 조회수 높은 순 게시글 조회 API',
    description: '월간 조회수가 높은 순으로 행성별 게시글을 조회합니다.',
  })
  @ApiParam({ name: 'planetId', description: '행성의 고유 ID' })
  @ApiQuery({ name: 'year', description: '조회할 연도', type: Number })
  @ApiQuery({ name: 'month', description: '조회할 월', type: Number })
  @ApiResponse({
    status: 200,
    description: '월간 조회수가 높은 게시글 조회 결과',
  })
  async getTopArticlesByViews(
    @Param('planetId', ParseIntPipe) planetId: number,
    @Query('year') year: number,
    @Query('month') month: number,
  ) {
    return this.viewCountService.getTopArticlesByMonthlyViews(
      planetId,
      year,
      month,
    );
  }

  @Get('ohter/:userId/articles')
  @UseGuards(JwtAuthGuard, LoggedInGuard)
  @ApiOperation({
    summary: '특정 사용자의 게시글 조회 API',
    description:
      '특정 사용자의 게시글을 페이지네이션하여 조회하고, 전체 페이지 수를 반환합니다.',
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
  async getOtherUserArticles(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const { articles, totalCount } =
      await this.articlesService.getArticlesByAuthor(userId, page, limit);
    return {
      data: articles,
      page,
      limit,
      totalCount,
    };
  }
}
