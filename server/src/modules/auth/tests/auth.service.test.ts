import { describe, expect, it } from 'vitest';
import { AuthService } from '../auth.service.js';
import { prisma } from '../../../shared/utils/prisma.js';

describe('AuthService.createUser', () => {
  it('should create a user with valid credentials', async () => {
    const email = `auth-${crypto.randomUUID()}@example.com`;
    const password = 'Password123!';

    const user = await AuthService.createUser(email, password);

    expect(user.id).toBeDefined();
    expect(user.email).toBe(email);

    const persistedUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    expect(persistedUser).not.toBeNull();
    expect(persistedUser?.email).toBe(email);
  });

  it('should reject creating a user with an existing email', async () => {
    const email = `duplicate-${crypto.randomUUID()}@example.com`;
    const password = 'Password123!';

    await AuthService.createUser(email, password);

    await expect(
      AuthService.createUser(email, 'AnotherPassword123!'),
    ).rejects.toThrow('User with this email already exists');
  });

  it('should reject creating a user with an invalid email', async () => {
    const email = `invalid-email`;
    const password = 'Password123!';

    await expect(AuthService.createUser(email, password)).rejects.toThrow();
  });

  it('should reject creating a user with an invalid password', async () => {
    await expect(
      AuthService.createUser(
        `weak-password-${crypto.randomUUID()}@example.com`,
        'password123',
      ),
    ).rejects.toThrow();
  });

  it('should reject creating a user with an empty email', async () => {
    await expect(AuthService.createUser('', 'Password123!')).rejects.toThrow();
  });

  describe('AuthService.findUserByEmail', () => {
    it('should return an existing user by email', async () => {
      const email = `find-${crypto.randomUUID()}@example.com`;
      const password = 'Password123!';

      const createdUser = await AuthService.createUser(email, password);

      const user = await AuthService.findUserByEmail(email);

      expect(user.id).toBe(createdUser.id);
      expect(user.email).toBe(email);
      expect(user.password).toBeDefined();
    });
  });

  it('should reject when the user does not exist', async () => {
    const email = `missing-${crypto.randomUUID()}@example.com`;

    await expect(AuthService.findUserByEmail(email)).rejects.toThrow(
      'Invalid credentials',
    );
  });
});

describe('AuthService.loginUser', () => {
  it('should login a user with valid credentials', async () => {
    const email = `login-${crypto.randomUUID()}@example.com`;
    const password = 'Password123!';

    const createdUser = await AuthService.createUser(email, password);

    const user = await AuthService.loginUser(email, password);

    expect(user.id).toBe(createdUser.id);
    expect(user.email).toBe(email);
  });

  it('should reject login with an incorrect password', async () => {
    const email = `wrong-password-${crypto.randomUUID()}@example.com`;
    const password = 'Password123!';

    await AuthService.createUser(email, password);

    await expect(
      AuthService.loginUser(email, 'WrongPassword123!'),
    ).rejects.toThrow('Invalid credentials');
  });

  it('should reject login when the user does not exist', async () => {
    const email = `missing-login-${crypto.randomUUID()}@example.com`;

    await expect(AuthService.loginUser(email, 'Password123!')).rejects.toThrow(
      'Invalid credentials',
    );
  });

  describe('AuthService.getUserById', () => {
    it('should return an existing user by id', async () => {
      const email = `user-by-id-${crypto.randomUUID()}@example.com`;

      const createdUser = await AuthService.createUser(email, 'Password123!');

      const user = await AuthService.getUserById(createdUser.id);

      expect(user.id).toBe(createdUser.id);
      expect(user.email).toBe(email);
    });
  });

  it('should reject when the user does not exist', async () => {
    const id = crypto.randomUUID();

    await expect(AuthService.getUserById(id)).rejects.toThrow('User not found');
  });
});

describe('AuthService.hashPassword', () => {
  it('should hash a password and not return the original value', async () => {
    const password = 'Password123!';

    const hashedPassword = await AuthService.hashPassword(password);

    expect(hashedPassword).toBeDefined();
    expect(hashedPassword).not.toBe(password);
    expect(hashedPassword).toMatch(/^\$2[aby]\$/);
  });
});

describe('AuthService.comparePasswords', () => {
  it('should correctly compare a password against its hash', async () => {
    const password = 'Password123!';
    const hashedPassword = await AuthService.hashPassword(password);

    expect(await AuthService.comparePasswords(password, hashedPassword)).toBe(
      true,
    );

    expect(
      await AuthService.comparePasswords('WrongPassword123!', hashedPassword),
    ).toBe(false);
  });
});