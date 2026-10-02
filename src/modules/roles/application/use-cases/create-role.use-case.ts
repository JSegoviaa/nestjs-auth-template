import { Role } from '../../domain/entities/role.entity.js';
import { RoleAlreadyExistsException } from '../../domain/exceptions/role.exceptions.js';
import { RoleRepository } from '../../domain/repositories/role.repository.js';
import { RoleDescription, RoleName } from '../../domain/value-objects/index.js';
import { RoleResponse } from '../dtos/role.response.js';
import { RolePermissionsService } from '../services/role-permissions.service.js';

export interface CreateRoleCommand {
  name: string;
  description?: string | null;
  permissionIds: string[];
}

export class CreateRoleUseCase {
  constructor(
    private readonly repository: RoleRepository,
    private readonly rolePermissions: RolePermissionsService,
  ) {}

  async execute(command: CreateRoleCommand): Promise<RoleResponse> {
    const name = RoleName.create(command.name);

    if (await this.repository.findByName(name)) {
      throw new RoleAlreadyExistsException(name.value);
    }

    const role = Role.create({
      name,
      description: RoleDescription.create(command.description),
      permissionIds: await this.rolePermissions.resolveIds(
        command.permissionIds,
      ),
    });

    await this.repository.save(role);

    return this.rolePermissions.toResponse(role);
  }
}
