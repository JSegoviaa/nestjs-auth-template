import type { PaginatedResult } from '../../../../shared/domain/pagination.js';
import { PermissionId } from '../../../permissions/domain/value-objects/index.js';
import { Role } from '../../../roles/domain/entities/index.js';
import {
  RoleListParams,
  RoleRepository,
} from '../../../roles/domain/repositories/index.js';
import { RoleId, RoleName } from '../../../roles/domain/value-objects/index.js';
import { User } from '../../domain/entities/user.entity.js';
import {
  UserAlreadyActiveException,
  UserAlreadyInactiveException,
  UserEmailAlreadyExistsException,
  UserNotFoundException,
  UserRolesNotFoundException,
  UserWithoutRolesException,
} from '../../domain/exceptions/user.exceptions.js';
import {
  UserListParams,
  UserRepository,
} from '../../domain/repositories/user.repository.js';
import { PasswordHasher } from '../../domain/services/password-hasher.js';
import {
  Email,
  HashedPassword,
  UserId,
  UserStatus,
} from '../../domain/value-objects/index.js';
import { UserRolesService } from '../services/user-roles.service.js';
import { ChangeUserStatusUseCase } from './change-user-status.use-case.js';
import { CreateUserUseCase } from './create-user.use-case.js';
import { EnsureRootUserUseCase } from './ensure-root-user.use-case.js';
import { GetUserUseCase } from './get-user.use-case.js';
import { ListUsersUseCase } from './list-users.use-case.js';
import { UpdateUserUseCase } from './update-user.use-case.js';

class FakePasswordHasher implements PasswordHasher {
  hash(plainPassword: string): Promise<HashedPassword> {
    return Promise.resolve(HashedPassword.fromHash(`hashed:${plainPassword}`));
  }

  verify(hashed: HashedPassword, plainPassword: string): Promise<boolean> {
    return Promise.resolve(hashed.value === `hashed:${plainPassword}`);
  }
}

class InMemoryRoleRepository implements RoleRepository {
  private readonly store = new Map<string, Role>();

  add(name: string): string {
    const role = Role.create({
      name: RoleName.create(name),
      permissionIds: [PermissionId.generate()],
    });
    this.store.set(role.id.value, role);
    return role.id.value;
  }

  save(role: Role): Promise<void> {
    this.store.set(role.id.value, role);
    return Promise.resolve();
  }

  findById(id: RoleId): Promise<Role | null> {
    return Promise.resolve(this.store.get(id.value) ?? null);
  }

  findByIds(ids: RoleId[]): Promise<Role[]> {
    return Promise.resolve(ids.flatMap((id) => this.store.get(id.value) ?? []));
  }

  findByName(): Promise<Role | null> {
    throw new Error('Not used');
  }

  findAll(_params: RoleListParams): Promise<PaginatedResult<Role>> {
    throw new Error('Not used');
  }

  delete(): Promise<void> {
    throw new Error('Not used');
  }
}

class InMemoryUserRepository implements UserRepository {
  readonly store = new Map<string, User>();

  save(user: User): Promise<void> {
    this.store.set(user.id.value, user);
    return Promise.resolve();
  }

  findById(id: UserId): Promise<User | null> {
    return Promise.resolve(this.store.get(id.value) ?? null);
  }

  findByEmail(email: Email): Promise<User | null> {
    const found = [...this.store.values()].find((u) => u.email.equals(email));
    return Promise.resolve(found ?? null);
  }

  findAll({
    page,
    limit,
    orderBy,
    sort,
  }: UserListParams): Promise<PaginatedResult<User>> {
    const direction = sort === 'asc' ? 1 : -1;
    const all = [...this.store.values()].sort((a, b) => {
      const left = a.toPrimitives()[orderBy];
      const right = b.toPrimitives()[orderBy];
      return (left < right ? -1 : left > right ? 1 : 0) * direction;
    });
    return Promise.resolve({
      items: all.slice((page - 1) * limit, page * limit),
      total: all.length,
      page,
      limit,
    });
  }
}

const MISSING_ID = '01920000-0000-7000-8000-000000000001';

describe('User use cases', () => {
  let users: InMemoryUserRepository;
  let roles: InMemoryRoleRepository;
  let create: CreateUserUseCase;
  let get: GetUserUseCase;
  let list: ListUsersUseCase;
  let update: UpdateUserUseCase;
  let changeStatus: ChangeUserStatusUseCase;
  let adminId: string;
  let editorId: string;

  const validUser = (overrides: Record<string, unknown> = {}) => ({
    firstName: 'María',
    lastName: 'Pérez',
    email: 'maria@example.com',
    password: 'Password1!',
    roleIds: [adminId],
    ...overrides,
  });

  beforeEach(() => {
    users = new InMemoryUserRepository();
    roles = new InMemoryRoleRepository();
    const userRoles = new UserRolesService(roles);
    create = new CreateUserUseCase(users, userRoles, new FakePasswordHasher());
    get = new GetUserUseCase(users, userRoles);
    list = new ListUsersUseCase(users, userRoles);
    update = new UpdateUserUseCase(users, userRoles);
    changeStatus = new ChangeUserStatusUseCase(users, userRoles);
    adminId = roles.add('Admin');
    editorId = roles.add('Editor');
  });

  it('creates a user with hashed password and resolved roles', async () => {
    const user = await create.execute(
      validUser({ email: 'Maria@Example.com', roleIds: [editorId, adminId] }),
    );

    expect(user.email).toBe('maria@example.com');
    expect(user.status).toBe(UserStatus.ACTIVE);
    expect(user.roles.map((r) => r.name)).toEqual(['Admin', 'Editor']);
    // The response never exposes the password...
    expect(user).not.toHaveProperty('password');
    // ...and only the hash is stored.
    expect(users.store.get(user.id)?.password.value).toBe('hashed:Password1!');
    await expect(get.execute(user.id)).resolves.toEqual(user);
  });

  it('validates roles', async () => {
    await expect(create.execute(validUser({ roleIds: [] }))).rejects.toThrow(
      UserWithoutRolesException,
    );
    await expect(
      create.execute(validUser({ roleIds: [MISSING_ID] })),
    ).rejects.toThrow(UserRolesNotFoundException);
  });

  it('rejects duplicate emails case-insensitively', async () => {
    await create.execute(validUser());

    await expect(
      create.execute(validUser({ email: 'MARIA@example.com' })),
    ).rejects.toThrow(UserEmailAlreadyExistsException);
  });

  it('updates fields, removes the phone and keeps roles unless sent', async () => {
    const { id } = await create.execute(
      validUser({ phoneNumber: '5512345678' }),
    );

    const updated = await update.execute({
      id,
      firstName: 'Ana',
      phoneNumber: null,
    });

    expect(updated.firstName).toBe('Ana');
    expect(updated.phoneNumber).toBeNull();
    expect(updated.roles.map((r) => r.id)).toEqual([adminId]);

    await expect(update.execute({ id, roleIds: [] })).rejects.toThrow(
      UserWithoutRolesException,
    );
  });

  it('does not allow taking another user email', async () => {
    const { id } = await create.execute(validUser());
    await create.execute(validUser({ email: 'otro@example.com' }));

    await expect(
      update.execute({ id, email: 'otro@example.com' }),
    ).rejects.toThrow(UserEmailAlreadyExistsException);
  });

  it('deactivates and reactivates a user', async () => {
    const { id } = await create.execute(validUser());

    const inactive = await changeStatus.execute({
      id,
      status: UserStatus.INACTIVE,
    });
    expect(inactive.status).toBe(UserStatus.INACTIVE);
    expect(inactive.deactivatedAt).toBeInstanceOf(Date);

    await expect(
      changeStatus.execute({ id, status: UserStatus.INACTIVE }),
    ).rejects.toThrow(UserAlreadyInactiveException);
    expect((await get.execute(id)).deactivatedAt).toEqual(
      inactive.deactivatedAt,
    );

    const active = await changeStatus.execute({
      id,
      status: UserStatus.ACTIVE,
    });
    expect(active.status).toBe(UserStatus.ACTIVE);
    expect(active.deactivatedAt).toBeNull();

    await expect(
      changeStatus.execute({ id, status: UserStatus.ACTIVE }),
    ).rejects.toThrow(UserAlreadyActiveException);

    await expect(
      changeStatus.execute({ id: MISSING_ID, status: UserStatus.ACTIVE }),
    ).rejects.toThrow(UserNotFoundException);
  });

  it('lists users with their roles', async () => {
    await create.execute(validUser({ firstName: 'Zoe', email: 'z@x.com' }));
    await create.execute(
      validUser({ firstName: 'Ana', email: 'a@x.com', roleIds: [editorId] }),
    );

    const result = await list.execute();

    expect(result.items.map((u) => [u.firstName, u.roles[0].name])).toEqual([
      ['Ana', 'Editor'],
      ['Zoe', 'Admin'],
    ]);
    expect(result.meta.total).toBe(2);
  });

  describe('EnsureRootUserUseCase', () => {
    let ensure: EnsureRootUserUseCase;
    const command = () => ({
      email: 'root@company.local',
      password: 'Password1!',
      firstName: 'Root',
      lastName: 'User',
      rootRoleId: RoleId.fromString(adminId),
    });

    beforeEach(() => {
      ensure = new EnsureRootUserUseCase(users, new FakePasswordHasher());
    });

    it('creates the root user once, with a hashed password', async () => {
      await expect(ensure.execute(command())).resolves.toBe('created');
      await expect(ensure.execute(command())).resolves.toBe('unchanged');

      const [root] = users.store.values();
      expect(users.store.size).toBe(1);
      expect(root.password.value).toBe('hashed:Password1!');
    });

    it('gives an existing user the ROOT role without touching the rest', async () => {
      const existing = await create.execute(
        validUser({ email: 'root@company.local', roleIds: [editorId] }),
      );

      await expect(
        ensure.execute({ ...command(), password: 'Other1!' }),
      ).resolves.toBe('role-assigned');

      const updated = users.store.get(existing.id)!;
      expect(updated.roleIds.map((id) => id.value).sort()).toEqual(
        [adminId, editorId].sort(),
      );
      // Its password is never overwritten.
      expect(updated.password.value).toBe('hashed:Password1!');
    });
  });
});
