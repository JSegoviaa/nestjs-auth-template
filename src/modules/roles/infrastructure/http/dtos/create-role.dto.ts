import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import {
  RoleDescription,
  RoleName,
} from '../../../domain/value-objects/index.js';

export class CreateRoleDto {
  @IsString()
  @MinLength(RoleName.MIN_LENGTH)
  @MaxLength(RoleName.MAX_LENGTH)
  @Matches(RoleName.PATTERN, { message: `name ${RoleName.FORMAT_MESSAGE}` })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(RoleDescription.MAX_LENGTH)
  description?: string | null;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsUUID('7', { each: true })
  permissionIds: string[];
}
