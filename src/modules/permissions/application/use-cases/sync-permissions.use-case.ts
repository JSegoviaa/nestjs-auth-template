import type { PermissionDefinition } from '../../domain/catalog/index.js';
import { Permission } from '../../domain/entities/permission.entity.js';
import { PermissionAlreadyExistsException } from '../../domain/exceptions/permission.exceptions.js';
import { PermissionRepository } from '../../domain/repositories/permission.repository.js';
import {
  PermissionDescription,
  PermissionName,
} from '../../domain/value-objects/index.js';

export interface SyncPermissionsResult {
  created: string[];
  updated: string[];
}

/**
 * Makes the database match the permission catalog: creates missing
 * permissions and updates changed descriptions. Idempotent; never deletes.
 */
export class SyncPermissionsUseCase {
  constructor(
    private readonly repository: PermissionRepository,
    private readonly definitions: readonly PermissionDefinition[],
  ) {}

  async execute(): Promise<SyncPermissionsResult> {
    const result: SyncPermissionsResult = { created: [], updated: [] };

    for (const definition of this.definitions) {
      const name = PermissionName.create(definition.name);
      const description = PermissionDescription.create(definition.description);
      const existing = await this.repository.findByName(name);

      if (!existing) {
        try {
          await this.repository.save(Permission.create({ name, description }));
          result.created.push(name.value);
        } catch (error) {
          // Another instance created it concurrently; nothing to do.
          if (!(error instanceof PermissionAlreadyExistsException)) throw error;
        }
        continue;
      }

      if (!existing.description.equals(description)) {
        existing.changeDescription(description);
        await this.repository.save(existing);
        result.updated.push(name.value);
      }
    }

    return result;
  }
}
