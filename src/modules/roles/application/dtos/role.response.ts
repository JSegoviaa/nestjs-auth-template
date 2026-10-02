export interface RolePermissionSummary {
  id: string;
  name: string;
}

export interface RoleResponse {
  id: string;
  name: string;
  description: string | null;
  permissions: RolePermissionSummary[];
  createdAt: Date;
  updatedAt: Date;
}
