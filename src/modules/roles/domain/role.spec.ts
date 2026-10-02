import { PermissionId } from '../../permissions/domain/value-objects/index.js';
import { Role } from './entities/role.entity.js';
import {
  InvalidRoleIdException,
  InvalidRoleNameException,
  RoleWithoutPermissionsException,
} from './exceptions/role.exceptions.js';
import { RoleId, RoleName } from './value-objects/index.js';

const P1 = PermissionId.generate();
const P2 = PermissionId.generate();

describe('RoleId', () => {
  it('rejects non-v7 UUIDs', () => {
    expect(() =>
      RoleId.fromString('3b241101-e2bb-4255-8caf-4136c566a962'),
    ).toThrow(InvalidRoleIdException);
  });
});

describe('RoleName', () => {
  it('trims and collapses spaces, keeping accents', () => {
    expect(RoleName.create('  Editor   de   contenido ').value).toBe(
      'Editor de contenido',
    );
    expect(RoleName.create('Diseñador gráfico').value).toBe(
      'Diseñador gráfico',
    );
  });

  it.each(['ab', ' -Admin', 'Admin!', 'a'.repeat(51)])(
    'rejects "%s"',
    (raw) => {
      expect(() => RoleName.create(raw)).toThrow(InvalidRoleNameException);
    },
  );
});

describe('Role', () => {
  it('deduplicates assigned permissions', () => {
    const role = Role.create({
      name: RoleName.create('Admin'),
      permissionIds: [P1, P1, P2],
    });

    expect(role.toPrimitives().permissionIds).toEqual([P1.value, P2.value]);
  });

  it('requires at least one permission on create and on reassign', () => {
    expect(() =>
      Role.create({ name: RoleName.create('Admin'), permissionIds: [] }),
    ).toThrow(RoleWithoutPermissionsException);

    const role = Role.create({
      name: RoleName.create('Admin'),
      permissionIds: [P1],
    });
    expect(() => role.assignPermissions([])).toThrow(
      RoleWithoutPermissionsException,
    );
    expect(role.toPrimitives().permissionIds).toEqual([P1.value]);
  });

  it('only touches updatedAt when the permission set changes', () => {
    const role = Role.create({
      name: RoleName.create('Admin'),
      permissionIds: [P1, P2],
    });
    const initial = role.updatedAt;

    role.assignPermissions([P2, P1]);
    expect(role.updatedAt).toBe(initial);

    role.assignPermissions([P1]);
    expect(role.toPrimitives().permissionIds).toEqual([P1.value]);
    expect(role.updatedAt).not.toBe(initial);
  });

  it('round-trips through primitives', () => {
    const role = Role.create({
      name: RoleName.create('Admin'),
      permissionIds: [P1],
    });

    expect(Role.fromPrimitives(role.toPrimitives()).toPrimitives()).toEqual(
      role.toPrimitives(),
    );
  });
});
