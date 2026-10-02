import { Catch, HttpStatus } from '@nestjs/common';

import { DomainException } from '../../../../shared/domain/domain.exception.js';
import {
  DomainExceptionFilter,
  type ExceptionStatusMap,
} from '../../../../shared/infrastructure/http/domain-exception.filter.js';
import {
  InvalidPermissionDescriptionException,
  InvalidPermissionIdException,
  InvalidPermissionNameException,
  PermissionAlreadyExistsException,
  PermissionNotFoundException,
} from '../../domain/exceptions/permission.exceptions.js';

const PERMISSION_EXCEPTION_STATUS: ExceptionStatusMap = new Map<
  Function,
  HttpStatus
>([
  [InvalidPermissionIdException, HttpStatus.BAD_REQUEST],
  [InvalidPermissionNameException, HttpStatus.BAD_REQUEST],
  [InvalidPermissionDescriptionException, HttpStatus.BAD_REQUEST],
  [PermissionNotFoundException, HttpStatus.NOT_FOUND],
  [PermissionAlreadyExistsException, HttpStatus.CONFLICT],
]);

@Catch(DomainException)
export class PermissionExceptionFilter extends DomainExceptionFilter {
  protected readonly statusByException = PERMISSION_EXCEPTION_STATUS;
}
