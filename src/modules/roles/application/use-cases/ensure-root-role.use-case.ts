import { PermissionRepository } from '../../../permissions/domain/repositories/index.js';
import {
  PermissionId,
  PermissionName,
} from '../../../permissions/domain/value-objects/index.js';
import { Role } from '../../domain/entities/role.entity.js';
import { RoleAlreadyExistsException } from '../../domain/exceptions/role.exceptions.js';
import { RoleRepository } from '../../domain/repositories/role.repository.js';
import {
  RoleDescription,
  RoleId,
  RoleName,
} from '../../domain/value-objects/index.js';

export const ROOT_ROLE_NAME = 'ROOT';
const ROOT_ROLE_DESCRIPTION = 'Acceso total al sistema';

export interface EnsureRootRoleResult {
  roleId: RoleId;
  created: boolean;
  permissionsUpdated: boolean;
}

/**
 * Makes sure the ROOT role exists and has exactly every permission of the
 * catalog. Idempotent: run on every startup, after syncing permissions.
 */
export class EnsureRootRoleUseCase {
  constructor(
    private readonly roles: RoleRepository,
    private readonly permissions: PermissionRepository,
    private readonly permissionNames: readonly string[],
  ) {}

  async execute(): Promise<EnsureRootRoleResult> {
    const permissionIds = await this.loadPermissionIds();
    const name = RoleName.create(ROOT_ROLE_NAME);
    const existing = await this.roles.findByName(name);

    if (existing) {
      const current = new Set(existing.permissionIds.map((id) => id.value));
      const permissionsUpdated =
        current.size !== permissionIds.length ||
        permissionIds.some((id) => !current.has(id.value));

      if (permissionsUpdated) {
        existing.assignPermissions(permissionIds);
        await this.roles.save(existing);
      }
      return { roleId: existing.id, created: false, permissionsUpdated };
    }

    const role = Role.create({
      name,
      description: RoleDescription.create(ROOT_ROLE_DESCRIPTION),
      permissionIds,
    });
    try {
      await this.roles.save(role);
    } catch (error) {
      if (error instanceof RoleAlreadyExistsException) return this.execute();
      throw error;
    }
    return { roleId: role.id, created: true, permissionsUpdated: true };
  }

  private async loadPermissionIds(): Promise<PermissionId[]> {
    const ids: PermissionId[] = [];
    for (const raw of this.permissionNames) {
      const permission = await this.permissions.findByName(
        PermissionName.create(raw),
      );
      if (!permission) {
        throw new Error(
          `Permission "${raw}" does not exist: sync permissions before ensuring the ROOT role`,
        );
      }
      ids.push(permission.id);
    }
    return ids;
  }
}
