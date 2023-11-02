import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class TransferSpaceshipOwnershipDto {
  @ApiProperty({
    description: '새로운 소유자의 사용자 ID',
    type: Number,
  })
  @IsInt()
  newOwnerId: number;
}
