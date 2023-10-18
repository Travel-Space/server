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
}
