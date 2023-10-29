import { Module } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { ArticlesController } from './articles.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { ViewCountModule } from 'src/view-count/view-count.module';

@Module({
  imports: [ViewCountModule],
  providers: [ArticlesService, PrismaService],
  controllers: [ArticlesController],
})
export class ArticlesModule {}
