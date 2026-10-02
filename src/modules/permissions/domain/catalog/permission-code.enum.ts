/**
 * Source of truth for every permission in the system. Synced to the database
 * on startup. Values must match the `PermissionName` format (e.g. USERS_CREATE).
 */
export enum PermissionCode {
  PERMISSION_READ = 'PERMISSION_READ',

  ROLE_CREATE = 'ROLE_CREATE',
  ROLE_READ = 'ROLE_READ',
  ROLE_UPDATE = 'ROLE_UPDATE',
  ROLE_DELETE = 'ROLE_DELETE',

  USER_CREATE = 'USER_CREATE',
  USER_READ = 'USER_READ',
  USER_UPDATE = 'USER_UPDATE',
  USER_UPDATE_STATUS = 'USER_UPDATE_STATUS',
}
