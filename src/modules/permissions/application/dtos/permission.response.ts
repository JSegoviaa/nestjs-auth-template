import { Permission } from '../../domain/entities/permission.entity.js';

export interface PermissionResponse {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const toPermissionResponse = (
  permission: Permission,
): PermissionResponse => {
  return permission.toPrimitives();
};
