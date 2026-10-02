import { PermissionCode } from './permission-code.enum.js';

export interface PermissionDefinition {
  name: string;
  description: string;
}

// Record forces a description for every enum member: adding a code
// without one is a compile error.
const PERMISSION_DESCRIPTIONS: Record<PermissionCode, string> = {
  [PermissionCode.PERMISSION_READ]: 'Consultar permisos',

  [PermissionCode.ROLE_CREATE]: 'Crear roles',
  [PermissionCode.ROLE_READ]: 'Consultar roles',
  [PermissionCode.ROLE_UPDATE]: 'Editar roles y sus permisos',
  [PermissionCode.ROLE_DELETE]: 'Eliminar roles',

  [PermissionCode.USER_CREATE]: 'Crear usuarios',
  [PermissionCode.USER_READ]: 'Consultar usuarios',
  [PermissionCode.USER_UPDATE]: 'Editar usuarios y sus roles',
  [PermissionCode.USER_UPDATE_STATUS]: 'Activar o desactivar usuarios',
};

export const PERMISSION_DEFINITIONS: readonly PermissionDefinition[] =
  Object.values(PermissionCode).map((code) => ({
    name: code,
    description: PERMISSION_DESCRIPTIONS[code],
  }));
