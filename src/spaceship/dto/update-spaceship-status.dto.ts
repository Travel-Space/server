import { ApiProperty } from '@nestjs/swagger';
import { SpaceshipStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateSpaceshipStatusDto {
  @ApiProperty({ description: '우주선 상태' })
  @IsEnum(SpaceshipStatus)
  status: SpaceshipStatus;
}
