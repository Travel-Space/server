import { SetMetadata } from '@nestjs/common';

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export const STATUS_KEY = 'status';
export const Status = (...status: UserStatus[]) =>
  SetMetadata(STATUS_KEY, status);
