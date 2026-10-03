import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PermissionCode } from '../../../../permissions/domain/catalog/index.js';
import type { AuthenticatedUser } from '../../../application/dtos/authenticated-user.js';
import { AuthPermission } from '../decorators/auth-permission.decorator.js';
import { PermissionsGuard } from './permissions.guard.js';

class TestController {
  @AuthPermission(PermissionCode.USER_READ, PermissionCode.ROLE_READ)
  both() {}

  @AuthPermission()
  authenticatedOnly() {}
}

const contextFor = (
  handler: keyof TestController,
  user?: AuthenticatedUser,
): ExecutionContext =>
  ({
    getHandler: () => TestController.prototype[handler],
    getClass: () => TestController,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  }) as unknown as ExecutionContext;

const userWith = (...permissions: string[]): AuthenticatedUser => ({
  id: 'u1',
  email: 'u1@example.com',
  permissions,
});

describe('PermissionsGuard + @AuthPermission', () => {
  const guard = new PermissionsGuard(new Reflector());

  it('allows when the user has ALL the required permissions', () => {
    expect(
      guard.canActivate(
        contextFor('both', userWith('USER_READ', 'ROLE_READ', 'USER_CREATE')),
      ),
    ).toBe(true);
  });

  it('forbids when any required permission is missing', () => {
    expect(() =>
      guard.canActivate(contextFor('both', userWith('USER_READ'))),
    ).toThrow(new ForbiddenException('Missing permissions: ROLE_READ'));
  });

  it('only requires authentication when no permissions are listed', () => {
    expect(guard.canActivate(contextFor('authenticatedOnly', userWith()))).toBe(
      true,
    );
  });

  it('rejects requests without an authenticated user', () => {
    expect(() => guard.canActivate(contextFor('both'))).toThrow(
      UnauthorizedException,
    );
  });
});
