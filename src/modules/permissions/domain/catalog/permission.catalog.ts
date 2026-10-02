import { PermissionCode } from './permission-code.enum.js';

export interface PermissionDefinition {
  name: string;
  description: string;
}

// Record forces a description for every enum member: adding a code
// without one is a compile error.
const PERMISSION_DESCRIPTIONS: Record<PermissionCode, string> = {
  [PermissionCode.PERMISSION_READ]: 'Consultar permisos',
};

export const PERMISSION_DEFINITIONS: readonly PermissionDefinition[] =
  Object.values(PermissionCode).map((code) => ({
    name: code,
    description: PERMISSION_DESCRIPTIONS[code],
  }));
