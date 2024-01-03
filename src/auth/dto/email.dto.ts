import { ApiProperty } from '@nestjs/swagger';

export class EmailDto {
  @ApiProperty({ description: '유저 이메일' })
  email: string;
}
