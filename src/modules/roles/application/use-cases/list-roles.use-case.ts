import {
  type ListQuery,
  type PaginatedResponse,
  resolveListParams,
  toPaginatedResponse,
} from '../../../../shared/application/pagination.js';
import {
  RoleOrderBy,
  RoleRepository,
} from '../../domain/repositories/role.repository.js';
import { RoleResponse } from '../dtos/role.response.js';
import { RolePermissionsService } from '../services/role-permissions.service.js';

export type ListRolesQuery = ListQuery<RoleOrderBy>;

const DEFAULT_ORDER_BY: RoleOrderBy = 'name';

export class ListRolesUseCase {
  constructor(
    private readonly repository: RoleRepository,
    private readonly rolePermissions: RolePermissionsService,
  ) {}

  async execute(
    query: ListRolesQuery = {},
  ): Promise<PaginatedResponse<RoleResponse>> {
    const result = await this.repository.findAll(
      resolveListParams(query, DEFAULT_ORDER_BY),
    );
    const items = await this.rolePermissions.toResponses(result.items);

    return toPaginatedResponse({ ...result, items }, (item) => item);
  }
}
