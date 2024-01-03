import { ApiProperty } from '@nestjs/swagger';
import { PlanetMemberRole } from '@prisma/client';
import { IsString } from 'class-validator';

export class UpdateMemberRoleDto {
  @ApiProperty({ description: '사용자에게 관리자 권한을 부여할지 여부' })
  @IsString()
  role: PlanetMemberRole;
}
