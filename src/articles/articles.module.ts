import { Module } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { ArticlesController } from './articles.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { ViewCountModule } from 'src/view-count/view-count.module';
import { CommentsModule } from 'src/comments/comments.module';
import { NotificationGateway } from 'src/notification/notification.gateway';
import { NotificationService } from 'src/notification/notification.service';

@Module({
  imports: [ViewCountModule, CommentsModule],
  providers: [
    ArticlesService,
    PrismaService,
    NotificationService,
    NotificationGateway,
  ],
  controllers: [ArticlesController],
})
export class ArticlesModule {}
