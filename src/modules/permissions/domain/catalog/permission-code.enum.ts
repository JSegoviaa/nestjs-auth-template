/**
 * Source of truth for every permission in the system. Synced to the database
 * on startup. Values must match the `PermissionName` format (e.g. USERS_CREATE).
 */
export enum PermissionCode {
  PERMISSION_READ = 'PERMISSION_READ',
}
