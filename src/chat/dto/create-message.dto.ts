import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsInt, IsString, Min } from 'class-validator';

export class CreateMessageDto {
  @IsNotEmpty({ message: '메시지 내용은 비어 있을 수 없습니다.' })
  @IsString({ message: '메시지 내용은 문자열이어야 합니다.' })
  @ApiProperty({
    type: String,
    description: '전송할 메시지 내용',
    example: '안녕하세요!',
  })
  content: string;

  @IsNotEmpty({ message: '채팅방 ID는 필수입니다.' })
  @IsInt({ message: '채팅방 ID는 숫자이어야 합니다.' })
  @ApiProperty({ type: Number, description: '채팅방 ID' })
  chatId: number;
}
