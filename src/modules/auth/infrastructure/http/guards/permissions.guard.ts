import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { PermissionCode } from '../../../../permissions/domain/catalog/index.js';
import type { AuthenticatedUser } from '../../../application/dtos/authenticated-user.js';

export const REQUIRED_PERMISSIONS_KEY = 'requiredPermissions';

/**
 * Runs after JwtAuthGuard. The user must have ALL the permissions listed in
 * @AuthPermission(); responds 403 otherwise.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required =
      this.reflector.getAllAndOverride<PermissionCode[] | undefined>(
        REQUIRED_PERMISSIONS_KEY,
        [context.getHandler(), context.getClass()],
      ) ?? [];

    if (!required.length) {
      return true;
    }

    const user = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>().user;
    if (!user) {
      throw new UnauthorizedException();
    }

    const granted = new Set(user.permissions);
    const missing = required.filter((permission) => !granted.has(permission));
    if (missing.length) {
      throw new ForbiddenException(
        `Missing permissions: ${missing.join(', ')}`,
      );
    }

    return true;
  }
}
