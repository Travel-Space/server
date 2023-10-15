import { ApiProperty } from '@nestjs/swagger';

export class VerifyCodeDto {
  @ApiProperty({ description: '유저 이메일' })
  email: string;

  @ApiProperty({ description: '인증 코드' })
  code: string;
}
