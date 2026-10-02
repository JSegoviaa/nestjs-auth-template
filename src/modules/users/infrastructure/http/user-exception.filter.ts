import { Catch, HttpStatus } from '@nestjs/common';

import { DomainException } from '../../../../shared/domain/domain.exception.js';
import {
  DomainExceptionFilter,
  type ExceptionStatusMap,
} from '../../../../shared/infrastructure/http/domain-exception.filter.js';
import { InvalidRoleIdException } from '../../../roles/domain/exceptions/index.js';
import {
  InvalidEmailException,
  InvalidHashedPasswordException,
  InvalidPersonNameException,
  InvalidPhoneNumberException,
  InvalidUserIdException,
  UserAlreadyActiveException,
  UserAlreadyInactiveException,
  UserEmailAlreadyExistsException,
  UserNotFoundException,
  UserRolesNotFoundException,
  UserWithoutRolesException,
} from '../../domain/exceptions/user.exceptions.js';

const USER_EXCEPTION_STATUS: ExceptionStatusMap = new Map<Function, HttpStatus>(
  [
    [InvalidUserIdException, HttpStatus.BAD_REQUEST],
    [InvalidPersonNameException, HttpStatus.BAD_REQUEST],
    [InvalidEmailException, HttpStatus.BAD_REQUEST],
    [InvalidPhoneNumberException, HttpStatus.BAD_REQUEST],
    [InvalidRoleIdException, HttpStatus.BAD_REQUEST],
    [UserWithoutRolesException, HttpStatus.BAD_REQUEST],
    // Should never happen through the API: the hasher always returns a hash.
    [InvalidHashedPasswordException, HttpStatus.INTERNAL_SERVER_ERROR],
    [UserNotFoundException, HttpStatus.NOT_FOUND],
    [UserRolesNotFoundException, HttpStatus.NOT_FOUND],
    [UserEmailAlreadyExistsException, HttpStatus.CONFLICT],
    [UserAlreadyActiveException, HttpStatus.CONFLICT],
    [UserAlreadyInactiveException, HttpStatus.CONFLICT],
  ],
);

@Catch(DomainException)
export class UserExceptionFilter extends DomainExceptionFilter {
  protected readonly statusByException = USER_EXCEPTION_STATUS;
}
