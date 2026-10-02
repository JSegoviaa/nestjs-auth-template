import {
  RoleAlreadyExistsException,
  RoleNotFoundException,
} from '../../domain/exceptions/role.exceptions.js';
import { RoleRepository } from '../../domain/repositories/role.repository.js';
import {
  RoleDescription,
  RoleId,
  RoleName,
} from '../../domain/value-objects/index.js';
import { RoleResponse } from '../dtos/role.response.js';
import { RolePermissionsService } from '../services/role-permissions.service.js';

export interface UpdateRoleCommand {
  id: string;
  name?: string;
  description?: string | null;
  /** Replaces the whole set of permissions when provided. */
  permissionIds?: string[];
}

export class UpdateRoleUseCase {
  constructor(
    private readonly repository: RoleRepository,
    private readonly rolePermissions: RolePermissionsService,
  ) {}

  async execute(command: UpdateRoleCommand): Promise<RoleResponse> {
    const role = await this.repository.findById(RoleId.fromString(command.id));

    if (!role) {
      throw new RoleNotFoundException(command.id);
    }

    if (command.name !== undefined) {
      const name = RoleName.create(command.name);
      const existing = await this.repository.findByName(name);
      if (existing && !existing.id.equals(role.id)) {
        throw new RoleAlreadyExistsException(name.value);
      }
      role.rename(name);
    }

    if (command.description !== undefined) {
      role.changeDescription(RoleDescription.create(command.description));
    }

    if (command.permissionIds !== undefined) {
      role.assignPermissions(
        await this.rolePermissions.resolveIds(command.permissionIds),
      );
    }

    await this.repository.save(role);

    return this.rolePermissions.toResponse(role);
  }
}
