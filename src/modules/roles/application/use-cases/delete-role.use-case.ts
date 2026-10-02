import { RoleNotFoundException } from '../../domain/exceptions/role.exceptions.js';
import { RoleRepository } from '../../domain/repositories/role.repository.js';
import { RoleId } from '../../domain/value-objects/index.js';

export class DeleteRoleUseCase {
  constructor(private readonly repository: RoleRepository) {}

  async execute(id: string): Promise<void> {
    const roleId = RoleId.fromString(id);

    if (!(await this.repository.findById(roleId))) {
      throw new RoleNotFoundException(id);
    }

    // Permission assignments are removed by the database (ON DELETE CASCADE).
    await this.repository.delete(roleId);
  }
}
