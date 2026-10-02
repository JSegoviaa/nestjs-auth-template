import { IsEnum } from 'class-validator';

import { UserStatus } from '../../../domain/value-objects/index.js';

export class ChangeUserStatusDto {
  @IsEnum(UserStatus)
  status: UserStatus;
}
