import type { UserStatus } from '../../domain/value-objects/index.js';

export interface UserRoleSummary {
  id: string;
  name: string;
}

/** Never includes the password hash. */
export interface UserResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  status: UserStatus;
  deactivatedAt: Date | null;
  roles: UserRoleSummary[];
  createdAt: Date;
  updatedAt: Date;
}
