import type {
  ListParams,
  PaginatedResult,
} from '../../../../shared/domain/pagination.js';
import { Permission } from '../entities/permission.entity.js';
import { PermissionId } from '../value-objects/permission-id.vo.js';
import { PermissionName } from '../value-objects/permission-name.vo.js';

export const PERMISSION_ORDER_BY_FIELDS = [
  'name',
  'createdAt',
  'updatedAt',
] as const;
export type PermissionOrderBy = (typeof PERMISSION_ORDER_BY_FIELDS)[number];

export type PermissionListParams = ListParams<PermissionOrderBy>;

/**
 * Output port. Declared as an abstract class so it can be used as a
 * NestJS injection token while staying framework-agnostic.
 */
export abstract class PermissionRepository {
  abstract save(permission: Permission): Promise<void>;
  abstract findById(id: PermissionId): Promise<Permission | null>;
  abstract findByName(name: PermissionName): Promise<Permission | null>;
  abstract findAll(
    params: PermissionListParams,
  ): Promise<PaginatedResult<Permission>>;
}
