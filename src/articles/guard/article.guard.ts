import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ArticleGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const articleId = parseInt(request.params.id, 10);
    const user = request.user;

    const articleWithMembership = await this.prisma.article.findUnique({
      where: { id: articleId },
      select: {
        planet: {
          select: {
            published: true,
            members: {
              where: { userId: user?.id },
              select: { userId: true },
            },
          },
        },
      },
    });

    if (!articleWithMembership) {
      throw new ForbiddenException('게시글을 찾을 수 없습니다.');
    }

    if (articleWithMembership.planet.published) {
      return true;
    } else {
      if (!user || articleWithMembership.planet.members.length === 0) {
        throw new ForbiddenException('해당 게시글에 액세스 권한이 없습니다.');
      }
      return true;
    }
  }
}
