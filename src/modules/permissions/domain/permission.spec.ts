import { version } from 'uuid';

import { Permission } from './entities/permission.entity.js';
import {
  InvalidPermissionDescriptionException,
  InvalidPermissionIdException,
  InvalidPermissionNameException,
} from './exceptions/permission.exceptions.js';
import { PermissionDescription } from './value-objects/permission-description.vo.js';
import { PermissionId } from './value-objects/permission-id.vo.js';
import { PermissionName } from './value-objects/permission-name.vo.js';

describe('PermissionId', () => {
  it('generates UUID v7 ids', () => {
    expect(version(PermissionId.generate().value)).toBe(7);
  });

  it('rejects non-v7 UUIDs', () => {
    expect(() =>
      PermissionId.fromString('3b241101-e2bb-4255-8caf-4136c566a962'),
    ).toThrow(InvalidPermissionIdException);
    expect(() => PermissionId.fromString('not-a-uuid')).toThrow(
      InvalidPermissionIdException,
    );
  });
});

describe('PermissionName', () => {
  it('normalizes to trimmed uppercase', () => {
    expect(PermissionName.create('  Users_Create ').value).toBe('USERS_CREATE');
  });

  it.each([
    'AB',
    'USERS CREATE',
    'USERS.CREATE',
    'USERS-CREATE',
    'USERS__CREATE',
    'USERS_',
    '_USERS',
    '1USERS',
    'A'.repeat(101),
  ])('rejects "%s"', (raw) => {
    expect(() => PermissionName.create(raw)).toThrow(
      InvalidPermissionNameException,
    );
  });
});

describe('PermissionDescription', () => {
  it('treats blank values as empty', () => {
    expect(PermissionDescription.create('   ').value).toBeNull();
    expect(PermissionDescription.create(undefined).value).toBeNull();
  });

  it('rejects values that are too long', () => {
    expect(() => PermissionDescription.create('a'.repeat(256))).toThrow(
      InvalidPermissionDescriptionException,
    );
  });
});

describe('Permission', () => {
  it('only touches updatedAt when something changes', () => {
    const permission = Permission.create({
      name: PermissionName.create('USERS_READ'),
      description: PermissionDescription.create('Read users'),
    });
    const initial = permission.updatedAt;

    permission.changeDescription(PermissionDescription.create('Read users'));
    expect(permission.updatedAt).toBe(initial);

    permission.changeDescription(PermissionDescription.create('List users'));
    expect(permission.description.value).toBe('List users');
    expect(permission.updatedAt).not.toBe(initial);
  });

  it('round-trips through primitives', () => {
    const permission = Permission.create({
      name: PermissionName.create('ROLES_UPDATE'),
      description: PermissionDescription.create('Edit roles'),
    });

    expect(
      Permission.fromPrimitives(permission.toPrimitives()).toPrimitives(),
    ).toEqual(permission.toPrimitives());
  });
});
