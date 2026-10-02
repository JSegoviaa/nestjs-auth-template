import {
  PermissionDescription,
  PermissionId,
  PermissionName,
} from '../value-objects/index.js';

export interface PermissionProps {
  id: PermissionId;
  name: PermissionName;
  description: PermissionDescription;
  createdAt: Date;
  updatedAt: Date;
}

export interface PermissionPrimitives {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Permission {
  private constructor(private props: PermissionProps) {}

  static create(params: {
    name: PermissionName;
    description?: PermissionDescription;
  }): Permission {
    const now = new Date();
    return new Permission({
      id: PermissionId.generate(),
      name: params.name,
      description: params.description ?? PermissionDescription.empty(),
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPrimitives(primitives: PermissionPrimitives): Permission {
    return new Permission({
      id: PermissionId.fromString(primitives.id),
      name: PermissionName.create(primitives.name),
      description: PermissionDescription.create(primitives.description),
      createdAt: primitives.createdAt,
      updatedAt: primitives.updatedAt,
    });
  }

  get id(): PermissionId {
    return this.props.id;
  }

  get name(): PermissionName {
    return this.props.name;
  }

  get description(): PermissionDescription {
    return this.props.description;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  changeDescription(description: PermissionDescription): void {
    if (this.props.description.equals(description)) return;
    this.props.description = description;
    this.touch();
  }

  toPrimitives(): PermissionPrimitives {
    return {
      id: this.props.id.value,
      name: this.props.name.value,
      description: this.props.description.value,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }
}
