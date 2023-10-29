import { Module } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { ArticlesController } from './articles.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { ViewCountService } from 'src/view-count/view-count.service';

@Module({
  imports: [ViewCountService],
  providers: [ArticlesService, PrismaService],
  controllers: [ArticlesController],
})
export class ArticlesModule {}
