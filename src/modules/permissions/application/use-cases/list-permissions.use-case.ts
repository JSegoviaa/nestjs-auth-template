import {
  type ListQuery,
  type PaginatedResponse,
  resolveListParams,
  toPaginatedResponse,
} from '../../../../shared/application/pagination.js';
import {
  PermissionOrderBy,
  PermissionRepository,
} from '../../domain/repositories/permission.repository.js';
import {
  PermissionResponse,
  toPermissionResponse,
} from '../dtos/permission.response.js';

export type ListPermissionsQuery = ListQuery<PermissionOrderBy>;

const DEFAULT_ORDER_BY: PermissionOrderBy = 'name';

export class ListPermissionsUseCase {
  constructor(private readonly repository: PermissionRepository) {}

  async execute(
    query: ListPermissionsQuery = {},
  ): Promise<PaginatedResponse<PermissionResponse>> {
    const result = await this.repository.findAll(
      resolveListParams(query, DEFAULT_ORDER_BY),
    );

    return toPaginatedResponse(result, toPermissionResponse);
  }
}
