import type {
  ListParams,
  PaginatedResult,
  SortDirection,
} from '../domain/pagination.js';

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 100;
export const DEFAULT_SORT: SortDirection = 'asc';

/** Raw list query as received by a use case; every field is optional. */
export interface ListQuery<TOrderBy extends string> {
  page?: number;
  limit?: number;
  orderBy?: TOrderBy;
  sort?: SortDirection;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/** Applies defaults and bounds; only the default `orderBy` varies per entity. */
export const resolveListParams = <TOrderBy extends string>(
  query: ListQuery<TOrderBy>,
  defaultOrderBy: TOrderBy,
): ListParams<TOrderBy> => ({
  page: Math.max(query.page ?? DEFAULT_PAGE, 1),
  limit: Math.min(Math.max(query.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT),
  orderBy: query.orderBy ?? defaultOrderBy,
  sort: query.sort ?? DEFAULT_SORT,
});

export const toPaginatedResponse = <TEntity, TResponse>(
  result: PaginatedResult<TEntity>,
  mapper: (entity: TEntity) => TResponse,
): PaginatedResponse<TResponse> => ({
  meta: {
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: Math.ceil(result.total / result.limit),
  },
  items: result.items.map(mapper),
});
