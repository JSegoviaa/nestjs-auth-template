import type {
  ListParams,
  PaginatedResult,
} from '../../../../shared/domain/pagination.js';
import { User } from '../entities/user.entity.js';
import { Email, UserId } from '../value-objects/index.js';

export const USER_ORDER_BY_FIELDS = [
  'firstName',
  'lastName',
  'email',
  'createdAt',
  'updatedAt',
] as const;
export type UserOrderBy = (typeof USER_ORDER_BY_FIELDS)[number];

export type UserListParams = ListParams<UserOrderBy>;

export abstract class UserRepository {
  abstract save(user: User): Promise<void>;
  abstract findById(id: UserId): Promise<User | null>;
  abstract findByEmail(email: Email): Promise<User | null>;
  abstract findAll(params: UserListParams): Promise<PaginatedResult<User>>;
}
