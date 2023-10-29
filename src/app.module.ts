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

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ArticlesModule,
    PlanetModule,
    UserModule,
    SpaceshipModule,
    ReportModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
