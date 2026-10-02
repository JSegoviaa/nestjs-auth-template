import { RoleNotFoundException } from '../../domain/exceptions/role.exceptions.js';
import { RoleRepository } from '../../domain/repositories/role.repository.js';
import { RoleId } from '../../domain/value-objects/index.js';
import { RoleResponse } from '../dtos/role.response.js';
import { RolePermissionsService } from '../services/role-permissions.service.js';

export class GetRoleUseCase {
  constructor(
    private readonly repository: RoleRepository,
    private readonly rolePermissions: RolePermissionsService,
  ) {}

  async execute(id: string): Promise<RoleResponse> {
    const role = await this.repository.findById(RoleId.fromString(id));

    if (!role) {
      throw new RoleNotFoundException(id);
    }

    return this.rolePermissions.toResponse(role);
  }
}
