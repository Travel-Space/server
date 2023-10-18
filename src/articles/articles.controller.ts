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
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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
  async getAllArticles() {
    return this.articlesService.getAllArticles();
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
  @ApiBody({ type: FindArticlesByPlanetDto })
  @Get('byPlanet')
  @UsePipes(ValidationPipe)
  async getArticlesByPlanet(
    @Query() findArticlesByPlanetDto: FindArticlesByPlanetDto,
  ) {
    return this.articlesService.getArticlesByPlanetId(
      findArticlesByPlanetDto.planetId,
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
    const userId = req.user.id;
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
    const userId = req.user.id;
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
    const userId = req.user.id;
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
    const userId = req.user.id;
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
    const userId = req.user.id;
    const updatedComment = await this.articlesService.updateComment(
      commentId,
      updateCommentDto,
      userId,
    );
    return res.json(updatedComment);
  }
}
