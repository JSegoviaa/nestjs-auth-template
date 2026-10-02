import type { UserGetPayload } from '../../../../generated/prisma/models.js';
import { User } from '../../domain/entities/user.entity.js';

/** Loads only the role ids of the join table, not whole roles. */
export const USER_INCLUDE = {
  roles: { select: { roleId: true } },
} as const;

export type PrismaUserWithRoles = UserGetPayload<{
  include: typeof USER_INCLUDE;
}>;

export class PrismaUserMapper {
  static toDomain(raw: PrismaUserWithRoles): User {
    return User.fromPrimitives({
      id: raw.id,
      firstName: raw.firstName,
      lastName: raw.lastName,
      email: raw.email,
      phoneNumber: raw.phoneNumber,
      password: raw.password,
      roleIds: raw.roles.map(({ roleId }) => roleId),
      deactivatedAt: raw.deactivatedAt,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}
