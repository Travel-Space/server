import { IsNotEmpty, IsInt, IsString, Min } from 'class-validator';

export class CreateMessageDto {
  @IsNotEmpty({ message: '메시지 내용은 비어 있을 수 없습니다.' })
  @IsString({ message: '메시지 내용은 문자열이어야 합니다.' })
  content: string;

  @IsNotEmpty({ message: '채팅방 ID는 필수입니다.' })
  @IsInt({ message: '채팅방 ID는 숫자이어야 합니다.' })
  chatId: number;
}
