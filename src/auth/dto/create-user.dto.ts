import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsJSON,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { CommonResponseDto } from 'src/common/dto';

export class CreateUserDto {
  @ApiProperty({
    description: '유저 이메일',
    example: 'exampleEmail@google.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({ description: '유저 네임', example: '홍길동' })
  @IsString()
  name: string;

  @ApiProperty({ description: '유저 닉네임', example: '닉네임' })
  @IsString()
  @MinLength(2)
  @MaxLength(8)
  nickName: string;

  @ApiProperty({ description: '유저 비밀번호', example: 'password' })
  @IsString()
  @MinLength(8)
  @Matches(/^[A-Za-z\d!@#$%^&*()]{6,20}$/, {
    message: '비밀번호 양식에 맞게 작성하세요.',
  })
  password: string;

  @ApiProperty({ description: '유저 국적', example: '대한민국' })
  @IsString()
  nationality: string;

  @ApiProperty({
    description: '유저 프로필 이미지 URL',
    example: 'http://example.com/profile.jpg',
  })
  profileImage?: string;
}

export class CreateUserResponse extends CommonResponseDto {
  @IsJSON()
  user: { id: string; email: string };
}
