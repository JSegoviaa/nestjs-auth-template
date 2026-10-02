import type { PaginatedResult } from '../../../../shared/domain/pagination.js';
import {
  PERMISSION_DEFINITIONS,
  PermissionCode,
} from '../../domain/catalog/index.js';
import { Permission } from '../../domain/entities/permission.entity.js';
import { PermissionNotFoundException } from '../../domain/exceptions/permission.exceptions.js';
import {
  PermissionListParams,
  PermissionRepository,
} from '../../domain/repositories/permission.repository.js';
import { PermissionId } from '../../domain/value-objects/permission-id.vo.js';
import { PermissionName } from '../../domain/value-objects/permission-name.vo.js';
import { GetPermissionUseCase } from './get-permission.use-case.js';
import { ListPermissionsUseCase } from './list-permissions.use-case.js';
import { SyncPermissionsUseCase } from './sync-permissions.use-case.js';

class InMemoryPermissionRepository implements PermissionRepository {
  private readonly store = new Map<string, Permission>();

  save(permission: Permission): Promise<void> {
    this.store.set(permission.id.value, permission);
    return Promise.resolve();
  }

  findById(id: PermissionId): Promise<Permission | null> {
    return Promise.resolve(this.store.get(id.value) ?? null);
  }

  findByName(name: PermissionName): Promise<Permission | null> {
    const found = [...this.store.values()].find((p) => p.name.equals(name));
    return Promise.resolve(found ?? null);
  }

  findAll({
    page,
    limit,
    orderBy,
    sort,
  }: PermissionListParams): Promise<PaginatedResult<Permission>> {
    const direction = sort === 'asc' ? 1 : -1;
    const all = [...this.store.values()].sort((a, b) => {
      const left = a.toPrimitives()[orderBy];
      const right = b.toPrimitives()[orderBy];
      const result =
        left < right
          ? -1
          : left > right
            ? 1
            : a.id.value.localeCompare(b.id.value);
      return result * direction;
    });
    return Promise.resolve({
      items: all.slice((page - 1) * limit, page * limit),
      total: all.length,
      page,
      limit,
    });
  }
}

const definitions = (...names: string[]) =>
  names.map((name) => ({ name, description: `${name} description` }));

describe('Permission use cases', () => {
  let repository: InMemoryPermissionRepository;
  let get: GetPermissionUseCase;
  let list: ListPermissionsUseCase;

  beforeEach(() => {
    repository = new InMemoryPermissionRepository();
    get = new GetPermissionUseCase(repository);
    list = new ListPermissionsUseCase(repository);
  });

  describe('SyncPermissionsUseCase', () => {
    it('creates every permission of the real catalog', async () => {
      await new SyncPermissionsUseCase(
        repository,
        PERMISSION_DEFINITIONS,
      ).execute();

      const result = await list.execute();
      expect(result.items.map((p) => p.name)).toContain(
        PermissionCode.PERMISSION_READ,
      );
    });

    it('only creates missing permissions and is idempotent', async () => {
      const first = await new SyncPermissionsUseCase(
        repository,
        definitions('A_PERM'),
      ).execute();
      const { id } = (await list.execute()).items[0];

      const second = await new SyncPermissionsUseCase(
        repository,
        definitions('A_PERM', 'B_PERM'),
      ).execute();
      const third = await new SyncPermissionsUseCase(
        repository,
        definitions('A_PERM', 'B_PERM'),
      ).execute();

      expect(first).toEqual({ created: ['A_PERM'], updated: [] });
      expect(second).toEqual({ created: ['B_PERM'], updated: [] });
      expect(third).toEqual({ created: [], updated: [] });
      // Existing permissions keep their id.
      expect((await get.execute(id)).name).toBe('A_PERM');
    });

    it('updates changed descriptions', async () => {
      await new SyncPermissionsUseCase(
        repository,
        definitions('A_PERM'),
      ).execute();

      const result = await new SyncPermissionsUseCase(repository, [
        { name: 'A_PERM', description: 'New description' },
      ]).execute();

      expect(result).toEqual({ created: [], updated: ['A_PERM'] });
      expect((await list.execute()).items[0].description).toBe(
        'New description',
      );
    });
  });

  it('gets a permission by id', async () => {
    await new SyncPermissionsUseCase(
      repository,
      definitions('A_PERM'),
    ).execute();
    const [permission] = (await list.execute()).items;

    await expect(get.execute(permission.id)).resolves.toEqual(permission);
    await expect(
      get.execute('01920000-0000-7000-8000-000000000001'),
    ).rejects.toThrow(PermissionNotFoundException);
  });

  it('paginates and sorts the list', async () => {
    await new SyncPermissionsUseCase(
      repository,
      definitions('B_PERM', 'C_PERM', 'A_PERM'),
    ).execute();

    const page2 = await list.execute({ page: 2, limit: 2 });
    expect(page2.items.map((p) => p.name)).toEqual(['C_PERM']);
    expect(page2.meta).toEqual({ total: 3, page: 2, limit: 2, totalPages: 2 });

    const byNameDesc = await list.execute({ orderBy: 'name', sort: 'desc' });
    expect(byNameDesc.items.map((p) => p.name)).toEqual([
      'C_PERM',
      'B_PERM',
      'A_PERM',
    ]);
  });
});
