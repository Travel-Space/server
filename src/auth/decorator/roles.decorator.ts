import { SetMetadata } from '@nestjs/common';

export enum userRole {
  MEMBER = 'MEMBER',
  ADMIN = 'ADMIN',
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: userRole[]) => SetMetadata(ROLES_KEY, roles);
