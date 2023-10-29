import { IsNotEmpty, IsString } from 'class-validator';

export class RejectReportDto {
  @IsNotEmpty()
  @IsString()
  readonly rejectionReason: string;
}
