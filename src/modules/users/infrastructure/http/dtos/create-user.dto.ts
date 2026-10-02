import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  IsStrongPassword,
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

export class CreateUserDto {
  @IsString()
  @MinLength(PersonName.MIN_LENGTH)
  @MaxLength(PersonName.MAX_LENGTH)
  @Matches(PersonName.PATTERN, {
    message: `firstName ${PersonName.FORMAT_MESSAGE}`,
  })
  firstName: string;

  @IsString()
  @MinLength(PersonName.MIN_LENGTH)
  @MaxLength(PersonName.MAX_LENGTH)
  @Matches(PersonName.PATTERN, {
    message: `lastName ${PersonName.FORMAT_MESSAGE}`,
  })
  lastName: string;

  @IsEmail()
  @MaxLength(Email.MAX_LENGTH)
  email: string;

  @IsOptional()
  @IsString()
  @Matches(PhoneNumber.PATTERN, {
    message: `phoneNumber ${PhoneNumber.FORMAT_MESSAGE}`,
  })
  phoneNumber?: string | null;

  // Defaults: min 8 chars, 1 lowercase, 1 uppercase, 1 number, 1 symbol.
  @IsStrongPassword()
  password: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsUUID('7', { each: true })
  roleIds: string[];
}
