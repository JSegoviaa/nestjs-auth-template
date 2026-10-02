import { Catch, HttpStatus } from '@nestjs/common';

import { DomainException } from '../../../../shared/domain/domain.exception.js';
import {
  DomainExceptionFilter,
  type ExceptionStatusMap,
} from '../../../../shared/infrastructure/http/domain-exception.filter.js';
import { InvalidPermissionIdException } from '../../../permissions/domain/exceptions/index.js';
import {
  InvalidRoleDescriptionException,
  InvalidRoleIdException,
  InvalidRoleNameException,
  RoleAlreadyExistsException,
  RoleAssignedToUsersException,
  RoleNotFoundException,
  RolePermissionsNotFoundException,
  RoleWithoutPermissionsException,
} from '../../domain/exceptions/role.exceptions.js';

const ROLE_EXCEPTION_STATUS: ExceptionStatusMap = new Map<Function, HttpStatus>(
  [
    [InvalidRoleIdException, HttpStatus.BAD_REQUEST],
    [InvalidRoleNameException, HttpStatus.BAD_REQUEST],
    [InvalidRoleDescriptionException, HttpStatus.BAD_REQUEST],
    [InvalidPermissionIdException, HttpStatus.BAD_REQUEST],
    [RoleWithoutPermissionsException, HttpStatus.BAD_REQUEST],
    [RoleNotFoundException, HttpStatus.NOT_FOUND],
    [RolePermissionsNotFoundException, HttpStatus.NOT_FOUND],
    [RoleAlreadyExistsException, HttpStatus.CONFLICT],
    [RoleAssignedToUsersException, HttpStatus.CONFLICT],
  ],
);

@Catch(DomainException)
export class RoleExceptionFilter extends DomainExceptionFilter {
  protected readonly statusByException = ROLE_EXCEPTION_STATUS;
}
