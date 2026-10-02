import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../database/prisma/prisma.service.js';
import { Prisma } from '../../../../generated/prisma/client.js';
import type { PaginatedResult } from '../../../../shared/domain/pagination.js';
import { User } from '../../domain/entities/user.entity.js';
import { UserEmailAlreadyExistsException } from '../../domain/exceptions/user.exceptions.js';
import {
  UserListParams,
  UserRepository,
} from '../../domain/repositories/user.repository.js';
import { Email, UserId } from '../../domain/value-objects/index.js';
import { PrismaUserMapper, USER_INCLUDE } from './prisma-user.mapper.js';

const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(user: User): Promise<void> {
    const { id, roleIds, ...data } = user.toPrimitives();

    try {
      // User and its role assignments are written atomically: removes the
      // roles no longer assigned and adds the new ones.
      await this.prisma.$transaction([
        this.prisma.user.upsert({
          where: { id },
          create: { id, ...data },
          update: data,
        }),
        this.prisma.userRole.deleteMany({
          where: { userId: id, roleId: { notIn: roleIds } },
        }),
        this.prisma.userRole.createMany({
          data: roleIds.map((roleId) => ({ userId: id, roleId })),
          skipDuplicates: true,
        }),
      ]);
    } catch (error) {
      // Covers the race where two requests pass the uniqueness check at once.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === UNIQUE_CONSTRAINT_VIOLATION
      ) {
        throw new UserEmailAlreadyExistsException(data.email);
      }
      throw error;
    }
  }

  async findById(id: UserId): Promise<User | null> {
    const raw = await this.prisma.user.findUnique({
      where: { id: id.value },
      include: USER_INCLUDE,
    });
    return raw ? PrismaUserMapper.toDomain(raw) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    // Emails are stored lowercased, so an exact match is case-insensitive.
    const raw = await this.prisma.user.findUnique({
      where: { email: email.value },
      include: USER_INCLUDE,
    });
    return raw ? PrismaUserMapper.toDomain(raw) : null;
  }

  async findAll({
    page,
    limit,
    orderBy,
    sort,
  }: UserListParams): Promise<PaginatedResult<User>> {
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        include: USER_INCLUDE,
        // id as tie-breaker keeps pagination stable when values repeat.
        orderBy: [{ [orderBy]: sort }, { id: sort }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count(),
    ]);

    return {
      items: rows.map((row) => PrismaUserMapper.toDomain(row)),
      total,
      page,
      limit,
    };
  }
}
