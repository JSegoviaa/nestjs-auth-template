import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../database/prisma/prisma.service.js';
import { Prisma } from '../../../../generated/prisma/client.js';
import type { PaginatedResult } from '../../../../shared/domain/pagination.js';
import { Permission } from '../../domain/entities/permission.entity.js';
import { PermissionAlreadyExistsException } from '../../domain/exceptions/permission.exceptions.js';
import {
  PermissionListParams,
  PermissionRepository,
} from '../../domain/repositories/permission.repository.js';
import {
  PermissionId,
  PermissionName,
} from '../../domain/value-objects/index.js';
import { PrismaPermissionMapper } from './prisma-permission.mapper.js';

const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';

@Injectable()
export class PrismaPermissionRepository implements PermissionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(permission: Permission): Promise<void> {
    const { id, ...data } = PrismaPermissionMapper.toPersistence(permission);

    try {
      await this.prisma.permission.upsert({
        where: { id },
        create: { id, ...data },
        update: data,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === UNIQUE_CONSTRAINT_VIOLATION
      ) {
        throw new PermissionAlreadyExistsException(data.name);
      }
      throw error;
    }
  }

  async findById(id: PermissionId): Promise<Permission | null> {
    const raw = await this.prisma.permission.findUnique({
      where: { id: id.value },
    });
    return raw ? PrismaPermissionMapper.toDomain(raw) : null;
  }

  async findByName(name: PermissionName): Promise<Permission | null> {
    const raw = await this.prisma.permission.findUnique({
      where: { name: name.value },
    });
    return raw ? PrismaPermissionMapper.toDomain(raw) : null;
  }

  async findAll({
    page,
    limit,
    orderBy,
    sort,
  }: PermissionListParams): Promise<PaginatedResult<Permission>> {
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.permission.findMany({
        orderBy: [{ [orderBy]: sort }, { id: sort }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.permission.count(),
    ]);

    return {
      items: rows.map((row) => PrismaPermissionMapper.toDomain(row)),
      total,
      page,
      limit,
    };
  }
}
