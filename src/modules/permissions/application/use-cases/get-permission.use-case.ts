import { PermissionNotFoundException } from '../../domain/exceptions/permission.exceptions.js';
import { PermissionRepository } from '../../domain/repositories/permission.repository.js';
import { PermissionId } from '../../domain/value-objects/permission-id.vo.js';
import {
  PermissionResponse,
  toPermissionResponse,
} from '../dtos/permission.response.js';

export class GetPermissionUseCase {
  constructor(private readonly repository: PermissionRepository) {}

  async execute(id: string): Promise<PermissionResponse> {
    const permission = await this.repository.findById(
      PermissionId.fromString(id),
    );

    if (!permission) {
      throw new PermissionNotFoundException(id);
    }

    return toPermissionResponse(permission);
  }
}
