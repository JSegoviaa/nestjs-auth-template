import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import {
  Email,
  PersonName,
  PhoneNumber,
} from '../../../domain/value-objects/index.js';

/** Status and password are changed through their own endpoints. */
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(PersonName.MIN_LENGTH)
  @MaxLength(PersonName.MAX_LENGTH)
  @Matches(PersonName.PATTERN, {
    message: `firstName ${PersonName.FORMAT_MESSAGE}`,
  })
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(PersonName.MIN_LENGTH)
  @MaxLength(PersonName.MAX_LENGTH)
  @Matches(PersonName.PATTERN, {
    message: `lastName ${PersonName.FORMAT_MESSAGE}`,
  })
  lastName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(Email.MAX_LENGTH)
  email?: string;

  /** Send null to remove the phone number. */
  @IsOptional()
  @IsString()
  @Matches(PhoneNumber.PATTERN, {
    message: `phoneNumber ${PhoneNumber.FORMAT_MESSAGE}`,
  })
  phoneNumber?: string | null;

  /** Replaces the whole set; must keep at least one role. */
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsUUID('7', { each: true })
  roleIds?: string[];
}
