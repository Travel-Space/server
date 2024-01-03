import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum InvitationResponse {
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

export class UpdateInvitationDto {
  @IsEnum(InvitationResponse)
  @ApiProperty({ enum: InvitationResponse })
  status: InvitationResponse;
}
