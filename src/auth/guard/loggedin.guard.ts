import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class LoggedInGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    if (!request.user || !request.user.userId) {
      throw new UnauthorizedException('로그인이 필요합니다.');
    }
    return true;
  }
}
