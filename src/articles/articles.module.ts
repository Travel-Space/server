import { Module } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { ArticlesController } from './articles.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { ViewCountModule } from 'src/view-count/view-count.module';
import { CommentsModule } from 'src/comments/comments.module';

@Module({
  imports: [ViewCountModule, CommentsModule],
  providers: [ArticlesService, PrismaService],
  controllers: [ArticlesController],
})
export class ArticlesModule {}
