export const SORT_DIRECTIONS = ['asc', 'desc'] as const;
export type SortDirection = (typeof SORT_DIRECTIONS)[number];

export interface PaginationParams {
  page: number;
  limit: number;
}

/** Params received by a repository's `findAll`. */
export interface ListParams<TOrderBy extends string> extends PaginationParams {
  orderBy: TOrderBy;
  sort: SortDirection;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
