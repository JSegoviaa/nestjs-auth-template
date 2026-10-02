import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../database/prisma/prisma.service.js';
import { Prisma } from '../../../../generated/prisma/client.js';
import type { PaginatedResult } from '../../../../shared/domain/pagination.js';
import { Role } from '../../domain/entities/role.entity.js';
import {
  RoleAlreadyExistsException,
  RoleAssignedToUsersException,
} from '../../domain/exceptions/role.exceptions.js';
import {
  RoleListParams,
  RoleRepository,
} from '../../domain/repositories/role.repository.js';
import { RoleId, RoleName } from '../../domain/value-objects/index.js';
import { PrismaRoleMapper, ROLE_INCLUDE } from './prisma-role.mapper.js';

const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';
const FOREIGN_KEY_VIOLATION = 'P2003';

@Injectable()
export class PrismaRoleRepository implements RoleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(role: Role): Promise<void> {
    const { id, permissionIds, ...data } = role.toPrimitives();

    try {
      await this.prisma.$transaction([
        this.prisma.role.upsert({
          where: { id },
          create: { id, ...data },
          update: data,
        }),
        this.prisma.rolePermission.deleteMany({
          where: { roleId: id, permissionId: { notIn: permissionIds } },
        }),
        this.prisma.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({
            roleId: id,
            permissionId,
          })),
          skipDuplicates: true,
        }),
      ]);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === UNIQUE_CONSTRAINT_VIOLATION
      ) {
        throw new RoleAlreadyExistsException(data.name);
      }
      throw error;
    }
  }

  async findById(id: RoleId): Promise<Role | null> {
    const raw = await this.prisma.role.findUnique({
      where: { id: id.value },
      include: ROLE_INCLUDE,
    });
    return raw ? PrismaRoleMapper.toDomain(raw) : null;
  }

  async findByIds(ids: RoleId[]): Promise<Role[]> {
    if (!ids.length) return [];
    const rows = await this.prisma.role.findMany({
      where: { id: { in: ids.map((id) => id.value) } },
      include: ROLE_INCLUDE,
    });
    return rows.map((row) => PrismaRoleMapper.toDomain(row));
  }

  async findByName(name: RoleName): Promise<Role | null> {
    const raw = await this.prisma.role.findFirst({
      where: { name: { equals: name.value, mode: 'insensitive' } },
      include: ROLE_INCLUDE,
    });
    return raw ? PrismaRoleMapper.toDomain(raw) : null;
  }

  async findAll({
    page,
    limit,
    orderBy,
    sort,
  }: RoleListParams): Promise<PaginatedResult<Role>> {
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.role.findMany({
        include: ROLE_INCLUDE,
        orderBy: [{ [orderBy]: sort }, { id: sort }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.role.count(),
    ]);

    return {
      items: rows.map((row) => PrismaRoleMapper.toDomain(row)),
      total,
      page,
      limit,
    };
  }

  async delete(id: RoleId): Promise<void> {
    try {
      await this.prisma.role.delete({ where: { id: id.value } });
    } catch (error) {
      // user_roles has ON DELETE RESTRICT: the role is still assigned.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === FOREIGN_KEY_VIOLATION
      ) {
        throw new RoleAssignedToUsersException(id.value);
      }
      throw error;
    }
  }
}
