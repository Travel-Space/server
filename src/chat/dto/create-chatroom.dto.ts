import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsArray, IsNumber, IsString } from 'class-validator';

export class CreateChatRoomDto {
  @IsArray()
  @IsNumber({}, { each: true })
  @IsNotEmpty()
  @ApiProperty({
    type: [Number],
    description: '참가자의 사용자 ID 배열',
    example: [1, 2, 3],
  })
  userIds: number[];
}
