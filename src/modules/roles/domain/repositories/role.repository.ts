import type {
  ListParams,
  PaginatedResult,
} from '../../../../shared/domain/pagination.js';
import { Role } from '../entities/role.entity.js';
import { RoleId, RoleName } from '../value-objects/index.js';

export const ROLE_ORDER_BY_FIELDS = ['name', 'createdAt', 'updatedAt'] as const;
export type RoleOrderBy = (typeof ROLE_ORDER_BY_FIELDS)[number];

export type RoleListParams = ListParams<RoleOrderBy>;

export abstract class RoleRepository {
  abstract save(role: Role): Promise<void>;
  abstract findById(id: RoleId): Promise<Role | null>;
  abstract findByName(name: RoleName): Promise<Role | null>;
  abstract findAll(params: RoleListParams): Promise<PaginatedResult<Role>>;
  abstract delete(id: RoleId): Promise<void>;
}
