export interface AuthenticatedUserView {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  isActive: boolean;
  roles: { id: string; name: string }[];
  /** Effective permissions: union of the permissions of all its roles. */
  permissions: string[];
}

/**
 * Read-only port: resolves a user with its roles and effective permissions
 * (users -> roles -> permissions) in a single query. Runs on every
 * authenticated request, so it skips loading full aggregates.
 */
export abstract class AuthenticatedUserReader {
  abstract findById(userId: string): Promise<AuthenticatedUserView | null>;
}
