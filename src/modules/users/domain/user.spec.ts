import { RoleId } from '../../roles/domain/value-objects/index.js';
import { User } from './entities/user.entity.js';
import {
  InvalidEmailException,
  InvalidPersonNameException,
  InvalidPhoneNumberException,
  UserAlreadyActiveException,
  UserAlreadyInactiveException,
  UserWithoutRolesException,
} from './exceptions/user.exceptions.js';
import {
  Email,
  HashedPassword,
  PersonName,
  PhoneNumber,
  UserStatus,
} from './value-objects/index.js';

const R1 = RoleId.generate();
const R2 = RoleId.generate();

const buildUser = (roleIds: RoleId[] = [R1]) =>
  User.create({
    firstName: PersonName.create('María José'),
    lastName: PersonName.create('Pérez'),
    email: Email.create('maria@example.com'),
    password: HashedPassword.fromHash('hash'),
    roleIds,
  });

describe('User value objects', () => {
  it('normalizes names and emails', () => {
    expect(PersonName.create('  María   José ').value).toBe('María José');
    expect(PersonName.create("O'Connor").value).toBe("O'Connor");
    expect(Email.create('  Maria@Example.COM ').value).toBe(
      'maria@example.com',
    );
  });

  it.each(['A', '1Juan', 'Juan!'])('rejects name "%s"', (raw) => {
    expect(() => PersonName.create(raw)).toThrow(InvalidPersonNameException);
  });

  it('rejects malformed emails', () => {
    expect(() => Email.create('not-an-email')).toThrow(InvalidEmailException);
  });

  it('accepts only 10-digit phone numbers', () => {
    expect(PhoneNumber.create('5512345678').value).toBe('5512345678');
    for (const raw of [
      '+525512345678',
      '551234567',
      '55123456789',
      '55-1234-5678',
    ]) {
      expect(() => PhoneNumber.create(raw)).toThrow(
        InvalidPhoneNumberException,
      );
    }
  });
});

describe('User', () => {
  it('requires at least one role on create and on reassign', () => {
    expect(() => buildUser([])).toThrow(UserWithoutRolesException);

    const user = buildUser([R1, R1, R2]);
    expect(user.toPrimitives().roleIds).toEqual([R1.value, R2.value]);
    expect(() => user.assignRoles([])).toThrow(UserWithoutRolesException);
  });

  it('starts active and toggles through deactivatedAt', () => {
    const user = buildUser();
    expect(user.status).toBe(UserStatus.ACTIVE);
    expect(user.deactivatedAt).toBeNull();

    user.changeStatus(UserStatus.INACTIVE);
    expect(user.status).toBe(UserStatus.INACTIVE);
    expect(user.deactivatedAt).toBeInstanceOf(Date);

    user.changeStatus(UserStatus.ACTIVE);
    expect(user.status).toBe(UserStatus.ACTIVE);
    expect(user.deactivatedAt).toBeNull();
  });

  it('rejects activating an active user or deactivating an inactive one', () => {
    const user = buildUser();
    expect(() => user.changeStatus(UserStatus.ACTIVE)).toThrow(
      UserAlreadyActiveException,
    );

    user.changeStatus(UserStatus.INACTIVE);
    const deactivatedAt = user.deactivatedAt;
    const updatedAt = user.updatedAt;

    expect(() => user.changeStatus(UserStatus.INACTIVE)).toThrow(
      UserAlreadyInactiveException,
    );
    // The original deactivation date is untouched.
    expect(user.deactivatedAt).toBe(deactivatedAt);
    expect(user.updatedAt).toBe(updatedAt);
  });

  it('can set and remove the phone number', () => {
    const user = buildUser();

    user.changePhoneNumber(PhoneNumber.create('5512345678'));
    expect(user.phoneNumber?.value).toBe('5512345678');

    user.changePhoneNumber(null);
    expect(user.phoneNumber).toBeNull();
  });

  it('round-trips through primitives', () => {
    const user = buildUser();

    expect(User.fromPrimitives(user.toPrimitives()).toPrimitives()).toEqual(
      user.toPrimitives(),
    );
  });
});
