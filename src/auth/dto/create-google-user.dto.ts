import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class CreateUserGoogleDto {
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

  @ApiProperty({ description: '유저 국적', example: '대한민국' })
  @IsString()
  nationality: string;

  @ApiProperty({
    description: '유저 프로필 이미지 URL',
    example: 'http://example.com/profile.jpg',
  })
  @IsString()
  profileImage?: string;

  @ApiProperty({
    description: '유저 국가 이미지 URL',
    example: 'http://example.com/nation.jpg',
  })
  @IsString()
  nationImage: string;
}
