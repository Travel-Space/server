import { IsNotEmpty, IsInt } from 'class-validator';

export class TransferOwnershipDto {
  @IsNotEmpty()
  @IsInt()
  newOwnerId: number;
}
