import { IsNotEmpty, IsString } from 'class-validator';

export class ApproveReportDto {
  @IsNotEmpty()
  @IsString()
  readonly approvalReason: string;
}
