import type { Role } from '../../../roles/domain/entities/index.js';
import { RoleRepository } from '../../../roles/domain/repositories/index.js';
import { RoleId } from '../../../roles/domain/value-objects/index.js';
import { User } from '../../domain/entities/user.entity.js';
import { UserRolesNotFoundException } from '../../domain/exceptions/user.exceptions.js';
import { UserResponse } from '../dtos/user.response.js';

/**
 * Bridges users with the roles module: validates assigned role ids and
 * resolves their names for responses.
 */
export class UserRolesService {
  constructor(private readonly roleRepository: RoleRepository) {}

  /** Parses the ids and checks that every one of them exists. */
  async resolveIds(rawIds: string[]): Promise<RoleId[]> {
    const ids = [...new Set(rawIds)].map((id) => RoleId.fromString(id));
    const found = await this.roleRepository.findByIds(ids);
    const foundIds = new Set(found.map((role) => role.id.value));

    const missing = ids.map((id) => id.value).filter((id) => !foundIds.has(id));
    if (missing.length) {
      throw new UserRolesNotFoundException(missing);
    }

    return ids;
  }

  async toResponse(user: User): Promise<UserResponse> {
    const [response] = await this.toResponses([user]);
    return response;
  }

  /** Loads the roles of all users in a single query. */
  async toResponses(users: User[]): Promise<UserResponse[]> {
    const ids = new Map(
      users.flatMap((user) => user.roleIds).map((id) => [id.value, id]),
    );
    const roles = await this.roleRepository.findByIds([...ids.values()]);
    const byId = new Map(roles.map((role) => [role.id.value, role]));

    return users.map((user) => toUserResponse(user, byId));
  }
}

const toUserResponse = (
  user: User,
  rolesById: Map<string, Role>,
): UserResponse => {
  // The password hash is deliberately left out.
  const {
    id,
    firstName,
    lastName,
    email,
    phoneNumber,
    roleIds,
    deactivatedAt,
    createdAt,
    updatedAt,
  } = user.toPrimitives();

  return {
    id,
    firstName,
    lastName,
    email,
    phoneNumber,
    status: user.status,
    deactivatedAt,
    roles: roleIds
      .flatMap((roleId) => rolesById.get(roleId) ?? [])
      .map((role) => ({ id: role.id.value, name: role.name.value }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    createdAt,
    updatedAt,
  };
};
