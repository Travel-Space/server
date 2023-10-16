import {
  Controller,
  Post,
  Body,
  Req,
  Put,
  Param,
  UseGuards,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ArticlesService } from './articles.service';
import { CreateArticleDto, UpdateArticleDto } from './dto';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';

@ApiTags('게시글 API')
@Controller('articles')
export class ArticlesController {
  constructor(private articlesService: ArticlesService) {}

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
    @Res({ passthrough: true }) res: Response,
  ) {
    const updatedArticle = await this.articlesService.updateArticle(
      id,
      updateArticleDto,
    );
    return res.json(updatedArticle);
  }
}
