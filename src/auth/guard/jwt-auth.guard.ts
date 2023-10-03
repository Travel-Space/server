import {
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from 'src/users/users.service';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
    private userService: UsersService,
  ) {
    super();
  }
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const { authorization } = request.headers;
    if (!authorization) {
      throw new HttpException('Token 전송 안됨', HttpStatus.UNAUTHORIZED);
    }

    const token = authorization.replace('Bearer ', '');
    const tokenValidate = await this.validate(token);
    if (tokenValidate.tokenReissue) {
      response.setHeader('accessToken', tokenValidate.newToken);
      response.setHeader('tokenReissue', true);
    } else {
      response.setHeader('tokenReissue', false);
    }
    request.user = tokenValidate.user ? tokenValidate.user : tokenValidate;
    return true;
  }

  async validate(token: string) {
    try {
      // 토큰 검증
      const tokenVerify = await this.authService.tokenValidate(token);

      // 토큰의 남은 시간 체크
      const tokenExp = new Date(tokenVerify['exp'] * 1000);
      const currentTime = new Date();
      const LIMIT_TIME = 5;

      const timeRemaining = Math.floor(
        (tokenExp.getTime() - currentTime.getTime()) / 1000 / 60,
      );
      if (tokenVerify.userToken !== 'loginToken') {
        return tokenVerify;
      }
      console.log('tokenVerify:', tokenVerify);
      if (timeRemaining < LIMIT_TIME) {
        // 로그인 토큰의남은 시간이 5분 미만일때
        // 엑세스 토큰 정보로 유저를 찾는다.
        const accessTokenUser = await this.userService.getUserById(
          tokenVerify.userId,
        );
        const refreshToken = await this.authService.tokenValidate(
          accessTokenUser.userRefreshToken,
        );
        const refreshTokenUser = await this.userService.getUserById(
          refreshToken.userId,
        );
        const newToken =
          await this.authService.createLoginToken(refreshTokenUser);

        return {
          user: refreshTokenUser,
          newToken,
          tokenReissue: true,
        };
      } else {
        // 로그인 토큰의남은 시간이 5분 이상일때
        const user = await this.userService.getUserById(tokenVerify.userId);
        return {
          user,
          tokenReissue: false,
        };
      }
    } catch (error) {
      switch (error.message) {
        // 토큰에 대한 오류를 판단합니다.
        case 'invalid token':
          throw new HttpException('유효하지 않은 토큰입니다.', 401);

        case 'jwt expired':
          throw new HttpException('토큰이 만료되었습니다.', 410);

        default:
          throw new HttpException(`${error}토큰 검증 오류입니다`, 401);
      }
    }
  }
}
