import {
  type ListQuery,
  type PaginatedResponse,
  resolveListParams,
  toPaginatedResponse,
} from '../../../../shared/application/pagination.js';
import {
  UserOrderBy,
  UserRepository,
} from '../../domain/repositories/user.repository.js';
import { UserResponse } from '../dtos/user.response.js';
import { UserRolesService } from '../services/user-roles.service.js';

export type ListUsersQuery = ListQuery<UserOrderBy>;

const DEFAULT_ORDER_BY: UserOrderBy = 'firstName';

export class ListUsersUseCase {
  constructor(
    private readonly repository: UserRepository,
    private readonly userRoles: UserRolesService,
  ) {}

  async execute(
    query: ListUsersQuery = {},
  ): Promise<PaginatedResponse<UserResponse>> {
    const result = await this.repository.findAll(
      resolveListParams(query, DEFAULT_ORDER_BY),
    );
    const items = await this.userRoles.toResponses(result.items);

    return toPaginatedResponse({ ...result, items }, (item) => item);
  }
}
