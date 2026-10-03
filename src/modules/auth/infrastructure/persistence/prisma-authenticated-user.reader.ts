import { Injectable } from '@nestjs/common';
import { validate } from 'uuid';

import { PrismaService } from '../../../../database/prisma/prisma.service.js';
import {
  AuthenticatedUserReader,
  AuthenticatedUserView,
} from '../../application/ports/authenticated-user.reader.js';

@Injectable()
export class PrismaAuthenticatedUserReader implements AuthenticatedUserReader {
  constructor(private readonly prisma: PrismaService) {}

  async findById(userId: string): Promise<AuthenticatedUserView | null> {
    // A tampered `sub` would make Postgres reject the uuid cast.
    if (!validate(userId)) return null;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        deactivatedAt: true,
        roles: {
          select: {
            role: {
              select: {
                id: true,
                name: true,
                permissions: {
                  select: { permission: { select: { name: true } } },
                },
              },
            },
          },
        },
      },
    });

    if (!user) return null;

    const permissions = new Set(
      user.roles.flatMap(({ role }) =>
        role.permissions.map(({ permission }) => permission.name),
      ),
    );

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      isActive: user.deactivatedAt === null,
      roles: user.roles
        .map(({ role }) => ({ id: role.id, name: role.name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      permissions: [...permissions].sort(),
    };
  }
}
