import { Permission as PrismaPermission } from '../../../../generated/prisma/client.js';
import { Permission } from '../../domain/entities/permission.entity.js';

export class PrismaPermissionMapper {
  static toDomain(raw: PrismaPermission): Permission {
    return Permission.fromPrimitives({
      id: raw.id,
      name: raw.name,
      description: raw.description,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toPersistence(permission: Permission): PrismaPermission {
    return permission.toPrimitives();
  }
}
