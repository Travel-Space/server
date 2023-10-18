import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, MinLength, Equals } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ description: '유저 이메일' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: '유저 변경할 비밀번호' })
  @IsString()
  @MinLength(6, { message: '비밀번호는 최소 6자 이상이어야 합니다.' })
  password: string;

  @ApiProperty({ description: '비밀번호 일치 확인' })
  @IsString()
  @Equals('password', { message: '비밀번호가 일치하지 않습니다.' })
  confirmPassword: string;
}
