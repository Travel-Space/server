import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateMemberRoleDto {
  @ApiProperty({ description: '사용자에게 관리자 권한을 부여할지 여부' })
  @IsBoolean()
  readonly isAdmin: boolean;
}
