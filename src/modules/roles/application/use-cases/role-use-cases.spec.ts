import type { PaginatedResult } from '../../../../shared/domain/pagination.js';
import { Permission } from '../../../permissions/domain/entities/index.js';
import { InvalidPermissionIdException } from '../../../permissions/domain/exceptions/index.js';
import {
  PermissionListParams,
  PermissionRepository,
} from '../../../permissions/domain/repositories/index.js';
import {
  PermissionId,
  PermissionName,
} from '../../../permissions/domain/value-objects/index.js';
import { Role } from '../../domain/entities/role.entity.js';
import {
  RoleAlreadyExistsException,
  RoleNotFoundException,
  RolePermissionsNotFoundException,
  RoleWithoutPermissionsException,
} from '../../domain/exceptions/role.exceptions.js';
import {
  RoleListParams,
  RoleRepository,
} from '../../domain/repositories/role.repository.js';
import { RoleId, RoleName } from '../../domain/value-objects/index.js';
import { RolePermissionsService } from '../services/role-permissions.service.js';
import { CreateRoleUseCase } from './create-role.use-case.js';
import { DeleteRoleUseCase } from './delete-role.use-case.js';
import { GetRoleUseCase } from './get-role.use-case.js';
import { ListRolesUseCase } from './list-roles.use-case.js';
import { UpdateRoleUseCase } from './update-role.use-case.js';

class InMemoryPermissionRepository implements PermissionRepository {
  readonly store = new Map<string, Permission>();

  add(name: string): string {
    const permission = Permission.create({ name: PermissionName.create(name) });
    this.store.set(permission.id.value, permission);
    return permission.id.value;
  }

  save(permission: Permission): Promise<void> {
    this.store.set(permission.id.value, permission);
    return Promise.resolve();
  }

  findById(id: PermissionId): Promise<Permission | null> {
    return Promise.resolve(this.store.get(id.value) ?? null);
  }

  findByIds(ids: PermissionId[]): Promise<Permission[]> {
    return Promise.resolve(ids.flatMap((id) => this.store.get(id.value) ?? []));
  }

  findByName(name: PermissionName): Promise<Permission | null> {
    const found = [...this.store.values()].find((p) => p.name.equals(name));
    return Promise.resolve(found ?? null);
  }

  findAll(_params: PermissionListParams): Promise<PaginatedResult<Permission>> {
    throw new Error('Not used');
  }
}

class InMemoryRoleRepository implements RoleRepository {
  private readonly store = new Map<string, Role>();

  save(role: Role): Promise<void> {
    this.store.set(role.id.value, role);
    return Promise.resolve();
  }

  findById(id: RoleId): Promise<Role | null> {
    return Promise.resolve(this.store.get(id.value) ?? null);
  }

  findByName(name: RoleName): Promise<Role | null> {
    const found = [...this.store.values()].find(
      (r) => r.name.value.toLowerCase() === name.value.toLowerCase(),
    );
    return Promise.resolve(found ?? null);
  }

  findAll({
    page,
    limit,
    orderBy,
    sort,
  }: RoleListParams): Promise<PaginatedResult<Role>> {
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

  delete(id: RoleId): Promise<void> {
    this.store.delete(id.value);
    return Promise.resolve();
  }
}

const MISSING_ID = '01920000-0000-7000-8000-000000000001';

describe('Role use cases', () => {
  let permissions: InMemoryPermissionRepository;
  let roles: InMemoryRoleRepository;
  let create: CreateRoleUseCase;
  let get: GetRoleUseCase;
  let list: ListRolesUseCase;
  let update: UpdateRoleUseCase;
  let remove: DeleteRoleUseCase;
  let readId: string;
  let writeId: string;

  beforeEach(() => {
    permissions = new InMemoryPermissionRepository();
    roles = new InMemoryRoleRepository();
    const rolePermissions = new RolePermissionsService(permissions);
    create = new CreateRoleUseCase(roles, rolePermissions);
    get = new GetRoleUseCase(roles, rolePermissions);
    list = new ListRolesUseCase(roles, rolePermissions);
    update = new UpdateRoleUseCase(roles, rolePermissions);
    remove = new DeleteRoleUseCase(roles);
    readId = permissions.add('USERS_READ');
    writeId = permissions.add('USERS_WRITE');
  });

  it('creates a role with its permissions resolved by name', async () => {
    const role = await create.execute({
      name: 'Admin',
      permissionIds: [writeId, readId],
    });

    expect(role.permissions).toEqual([
      { id: readId, name: 'USERS_READ' },
      { id: writeId, name: 'USERS_WRITE' },
    ]);
    await expect(get.execute(role.id)).resolves.toEqual(role);
  });

  it('rejects unknown or malformed permission ids', async () => {
    await expect(
      create.execute({ name: 'Admin', permissionIds: [readId, MISSING_ID] }),
    ).rejects.toThrow(RolePermissionsNotFoundException);
    await expect(
      create.execute({ name: 'Admin', permissionIds: ['not-a-uuid'] }),
    ).rejects.toThrow(InvalidPermissionIdException);
  });

  it('rejects roles without permissions', async () => {
    await expect(
      create.execute({ name: 'Admin', permissionIds: [] }),
    ).rejects.toThrow(RoleWithoutPermissionsException);
  });

  it('rejects duplicate names case-insensitively', async () => {
    await create.execute({ name: 'Admin', permissionIds: [readId] });

    await expect(
      create.execute({ name: 'ADMIN', permissionIds: [readId] }),
    ).rejects.toThrow(RoleAlreadyExistsException);
  });

  it('replaces permissions only when provided', async () => {
    const { id } = await create.execute({
      name: 'Editor',
      permissionIds: [readId],
    });

    const renamed = await update.execute({ id, name: 'Editor web' });
    expect(renamed.permissions.map((p) => p.id)).toEqual([readId]);

    const replaced = await update.execute({ id, permissionIds: [writeId] });
    expect(replaced.permissions.map((p) => p.id)).toEqual([writeId]);

    await expect(update.execute({ id, permissionIds: [] })).rejects.toThrow(
      RoleWithoutPermissionsException,
    );
    // The failed update left the role untouched.
    expect((await get.execute(id)).permissions.map((p) => p.id)).toEqual([
      writeId,
    ]);
  });

  it('lists roles with their permissions', async () => {
    await create.execute({ name: 'Viewer', permissionIds: [readId] });
    await create.execute({ name: 'Admin', permissionIds: [readId, writeId] });

    const result = await list.execute();

    expect(result.items.map((r) => [r.name, r.permissions.length])).toEqual([
      ['Admin', 2],
      ['Viewer', 1],
    ]);
    expect(result.meta.total).toBe(2);
  });

  it('deletes a role', async () => {
    const { id } = await create.execute({
      name: 'Temp',
      permissionIds: [readId],
    });

    await remove.execute(id);

    await expect(get.execute(id)).rejects.toThrow(RoleNotFoundException);
  });
});
