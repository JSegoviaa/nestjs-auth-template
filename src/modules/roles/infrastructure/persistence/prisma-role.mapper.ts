import type { RoleGetPayload } from '../../../../generated/prisma/models.js';
import { Role } from '../../domain/entities/role.entity.js';

/** Loads only the permission ids of the join table, not whole permissions. */
export const ROLE_INCLUDE = {
  permissions: { select: { permissionId: true } },
} as const;

export type PrismaRoleWithPermissions = RoleGetPayload<{
  include: typeof ROLE_INCLUDE;
}>;

export class PrismaRoleMapper {
  static toDomain(raw: PrismaRoleWithPermissions): Role {
    return Role.fromPrimitives({
      id: raw.id,
      name: raw.name,
      description: raw.description,
      permissionIds: raw.permissions.map(({ permissionId }) => permissionId),
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}
