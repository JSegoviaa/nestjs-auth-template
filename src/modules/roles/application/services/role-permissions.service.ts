import type { Permission } from '../../../permissions/domain/entities/index.js';
import { PermissionRepository } from '../../../permissions/domain/repositories/index.js';
import { PermissionId } from '../../../permissions/domain/value-objects/index.js';
import { Role } from '../../domain/entities/role.entity.js';
import { RolePermissionsNotFoundException } from '../../domain/exceptions/role.exceptions.js';
import { RoleResponse } from '../dtos/role.response.js';

/**
 * Bridges roles with the permissions module: validates assigned permission
 * ids and resolves their names for responses.
 */
export class RolePermissionsService {
  constructor(private readonly permissionRepository: PermissionRepository) {}

  /** Parses the ids and checks that every one of them exists. */
  async resolveIds(rawIds: string[]): Promise<PermissionId[]> {
    const ids = [...new Set(rawIds)].map((id) => PermissionId.fromString(id));
    const found = await this.permissionRepository.findByIds(ids);
    const foundIds = new Set(found.map((permission) => permission.id.value));

    const missing = ids.map((id) => id.value).filter((id) => !foundIds.has(id));
    if (missing.length) {
      throw new RolePermissionsNotFoundException(missing);
    }

    return ids;
  }

  async toResponse(role: Role): Promise<RoleResponse> {
    const [response] = await this.toResponses([role]);
    return response;
  }

  /** Loads the permissions of all roles in a single query. */
  async toResponses(roles: Role[]): Promise<RoleResponse[]> {
    const ids = new Map(
      roles.flatMap((role) => role.permissionIds).map((id) => [id.value, id]),
    );
    const permissions = await this.permissionRepository.findByIds([
      ...ids.values(),
    ]);
    const byId = new Map(permissions.map((p) => [p.id.value, p]));

    return roles.map((role) => toRoleResponse(role, byId));
  }
}

const toRoleResponse = (
  role: Role,
  permissionsById: Map<string, Permission>,
): RoleResponse => {
  const { id, name, description, permissionIds, createdAt, updatedAt } =
    role.toPrimitives();

  return {
    id,
    name,
    description,
    permissions: permissionIds
      .flatMap((permissionId) => permissionsById.get(permissionId) ?? [])
      .map((permission) => ({
        id: permission.id.value,
        name: permission.name.value,
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    createdAt,
    updatedAt,
  };
};
