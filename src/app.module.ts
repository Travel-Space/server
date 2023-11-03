import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ArticlesModule } from './articles/articles.module';
import { PlanetModule } from './planet/planet.module';
import { UserModule } from './user/user.module';
import { SpaceshipModule } from './spaceship/spaceship.module';
import { ReportModule } from './report/report.module';
import { CommentsModule } from './comments/comments.module';
import { ViewCountModule } from './view-count/view-count.module';
import { ChatGateway } from './websockets/websockets.gateway';
import { WebsocketsModule } from './websockets/websockets.module';
import { ChatController } from './chat/chat.controller';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ArticlesModule,
    PlanetModule,
    UserModule,
    SpaceshipModule,
    ReportModule,
    CommentsModule,
    ViewCountModule,
    WebsocketsModule,
    ChatModule,
  ],
  controllers: [AppController, ChatController],
  providers: [AppService, ChatGateway],
})
export class AppModule {}
