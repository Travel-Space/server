import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ArticlesModule } from './articles/articles.module';
import { PlanetModule } from './planet/planet.module';

@Module({
  imports: [PrismaModule, AuthModule, ArticlesModule, PlanetModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
