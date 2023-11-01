import { SpaceshipStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateSpaceshipStatusDto {
  @IsEnum(SpaceshipStatus)
  status: SpaceshipStatus;
}
