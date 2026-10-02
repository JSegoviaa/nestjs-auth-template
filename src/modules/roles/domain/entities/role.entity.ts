import { PermissionId } from '../../../permissions/domain/value-objects/index.js';
import { RoleWithoutPermissionsException } from '../exceptions/role.exceptions.js';
import { RoleDescription, RoleId, RoleName } from '../value-objects/index.js';

export interface RoleProps {
  id: RoleId;
  name: RoleName;
  description: RoleDescription;
  permissionIds: PermissionId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RolePrimitives {
  id: string;
  name: string;
  description: string | null;
  permissionIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

const unique = (ids: PermissionId[]): PermissionId[] => [
  ...new Map(ids.map((id) => [id.value, id])).values(),
];

/** Invariant: a role always has at least one permission. */
const toPermissionSet = (ids: PermissionId[]): PermissionId[] => {
  const set = unique(ids);
  if (!set.length) {
    throw new RoleWithoutPermissionsException();
  }
  return set;
};

export class Role {
  private constructor(private props: RoleProps) {}

  static create(params: {
    name: RoleName;
    description?: RoleDescription;
    permissionIds: PermissionId[];
  }): Role {
    const now = new Date();
    return new Role({
      id: RoleId.generate(),
      name: params.name,
      description: params.description ?? RoleDescription.empty(),
      permissionIds: toPermissionSet(params.permissionIds),
      createdAt: now,
      updatedAt: now,
    });
  }

  /** Rebuilds an existing role (e.g. from persistence). */
  static fromPrimitives(primitives: RolePrimitives): Role {
    return new Role({
      id: RoleId.fromString(primitives.id),
      name: RoleName.create(primitives.name),
      description: RoleDescription.create(primitives.description),
      permissionIds: unique(
        primitives.permissionIds.map((id) => PermissionId.fromString(id)),
      ),
      createdAt: primitives.createdAt,
      updatedAt: primitives.updatedAt,
    });
  }

  get id(): RoleId {
    return this.props.id;
  }

  get name(): RoleName {
    return this.props.name;
  }

  get description(): RoleDescription {
    return this.props.description;
  }

  get permissionIds(): readonly PermissionId[] {
    return this.props.permissionIds;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  rename(name: RoleName): void {
    if (this.props.name.equals(name)) return;
    this.props.name = name;
    this.touch();
  }

  changeDescription(description: RoleDescription): void {
    if (this.props.description.equals(description)) return;
    this.props.description = description;
    this.touch();
  }

  /** Replaces the whole set of assigned permissions (at least one). */
  assignPermissions(permissionIds: PermissionId[]): void {
    const next = toPermissionSet(permissionIds);
    const current = new Set(this.props.permissionIds.map((id) => id.value));
    const changed =
      next.length !== current.size || next.some((id) => !current.has(id.value));
    if (!changed) return;
    this.props.permissionIds = next;
    this.touch();
  }

  toPrimitives(): RolePrimitives {
    return {
      id: this.props.id.value,
      name: this.props.name.value,
      description: this.props.description.value,
      permissionIds: this.props.permissionIds.map((id) => id.value),
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }
}
