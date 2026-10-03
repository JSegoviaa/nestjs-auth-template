import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';

import type { PermissionCode } from '../../../../permissions/domain/catalog/index.js';
import { JwtAuthGuard } from '../guards/jwt-auth.guard.js';
import {
  PermissionsGuard,
  REQUIRED_PERMISSIONS_KEY,
} from '../guards/permissions.guard.js';

/**
 * Protects an endpoint (or a whole controller): requires a valid access
 * token and ALL the given permissions.
 *
 * @example
 * @AuthPermission(PermissionCode.USER_READ)
 * @AuthPermission(PermissionCode.ROLE_READ, PermissionCode.USER_UPDATE)
 * @AuthPermission() // only authentication, no specific permission
 */
export const AuthPermission = (...permissions: PermissionCode[]) =>
  applyDecorators(
    SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions),
    UseGuards(JwtAuthGuard, PermissionsGuard),
  );
