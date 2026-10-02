import { RoleId } from '../../../roles/domain/value-objects/index.js';
import {
  UserAlreadyActiveException,
  UserAlreadyInactiveException,
  UserWithoutRolesException,
} from '../exceptions/user.exceptions.js';
import {
  Email,
  HashedPassword,
  PersonName,
  PhoneNumber,
  UserId,
  UserStatus,
} from '../value-objects/index.js';

export interface UserProps {
  id: UserId;
  firstName: PersonName;
  lastName: PersonName;
  email: Email;
  phoneNumber: PhoneNumber | null;
  password: HashedPassword;
  roleIds: RoleId[];
  deactivatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPrimitives {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  password: string;
  roleIds: string[];
  deactivatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const toRoleSet = (ids: RoleId[]): RoleId[] => {
  const set = [...new Map(ids.map((id) => [id.value, id])).values()];
  if (!set.length) {
    throw new UserWithoutRolesException();
  }
  return set;
};

export class User {
  private constructor(private props: UserProps) {}

  static create(params: {
    firstName: PersonName;
    lastName: PersonName;
    email: Email;
    phoneNumber?: PhoneNumber | null;
    password: HashedPassword;
    roleIds: RoleId[];
  }): User {
    const now = new Date();
    return new User({
      id: UserId.generate(),
      firstName: params.firstName,
      lastName: params.lastName,
      email: params.email,
      phoneNumber: params.phoneNumber ?? null,
      password: params.password,
      roleIds: toRoleSet(params.roleIds),
      deactivatedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  /** Rebuilds an existing user (e.g. from persistence). */
  static fromPrimitives(primitives: UserPrimitives): User {
    return new User({
      id: UserId.fromString(primitives.id),
      firstName: PersonName.create(primitives.firstName),
      lastName: PersonName.create(primitives.lastName),
      email: Email.create(primitives.email),
      phoneNumber:
        primitives.phoneNumber === null
          ? null
          : PhoneNumber.create(primitives.phoneNumber),
      password: HashedPassword.fromHash(primitives.password),
      roleIds: primitives.roleIds.map((id) => RoleId.fromString(id)),
      deactivatedAt: primitives.deactivatedAt,
      createdAt: primitives.createdAt,
      updatedAt: primitives.updatedAt,
    });
  }

  get id(): UserId {
    return this.props.id;
  }

  get firstName(): PersonName {
    return this.props.firstName;
  }

  get lastName(): PersonName {
    return this.props.lastName;
  }

  get email(): Email {
    return this.props.email;
  }

  get phoneNumber(): PhoneNumber | null {
    return this.props.phoneNumber;
  }

  get password(): HashedPassword {
    return this.props.password;
  }

  get roleIds(): readonly RoleId[] {
    return this.props.roleIds;
  }

  get deactivatedAt(): Date | null {
    return this.props.deactivatedAt;
  }

  get status(): UserStatus {
    return this.props.deactivatedAt ? UserStatus.INACTIVE : UserStatus.ACTIVE;
  }

  get isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  changeFirstName(firstName: PersonName): void {
    if (this.props.firstName.equals(firstName)) return;
    this.props.firstName = firstName;
    this.touch();
  }

  changeLastName(lastName: PersonName): void {
    if (this.props.lastName.equals(lastName)) return;
    this.props.lastName = lastName;
    this.touch();
  }

  changeEmail(email: Email): void {
    if (this.props.email.equals(email)) return;
    this.props.email = email;
    this.touch();
  }

  /** `null` removes the phone number. */
  changePhoneNumber(phoneNumber: PhoneNumber | null): void {
    const current = this.props.phoneNumber;
    const same =
      current === null || phoneNumber === null
        ? current === phoneNumber
        : current.equals(phoneNumber);
    if (same) return;
    this.props.phoneNumber = phoneNumber;
    this.touch();
  }

  /** Replaces the whole set of assigned roles (at least one). */
  assignRoles(roleIds: RoleId[]): void {
    const next = toRoleSet(roleIds);
    const current = new Set(this.props.roleIds.map((id) => id.value));
    const changed =
      next.length !== current.size || next.some((id) => !current.has(id.value));
    if (!changed) return;
    this.props.roleIds = next;
    this.touch();
  }

  deactivate(): void {
    if (!this.isActive) {
      throw new UserAlreadyInactiveException(this.props.id.value);
    }
    this.props.deactivatedAt = new Date();
    this.touch();
  }

  activate(): void {
    if (this.isActive) {
      throw new UserAlreadyActiveException(this.props.id.value);
    }
    this.props.deactivatedAt = null;
    this.touch();
  }

  changeStatus(status: UserStatus): void {
    if (status === UserStatus.ACTIVE) {
      this.activate();
    } else {
      this.deactivate();
    }
  }

  toPrimitives(): UserPrimitives {
    return {
      id: this.props.id.value,
      firstName: this.props.firstName.value,
      lastName: this.props.lastName.value,
      email: this.props.email.value,
      phoneNumber: this.props.phoneNumber?.value ?? null,
      password: this.props.password.value,
      roleIds: this.props.roleIds.map((id) => id.value),
      deactivatedAt: this.props.deactivatedAt,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }
}
