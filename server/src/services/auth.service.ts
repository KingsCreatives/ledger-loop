import bcrypt from 'bcrypt';
import { prisma } from '../utils/prisma';
import { AuthUser, PublicUser } from '../types';
import {
  ValidationError,
  ConflictError,
  UnauthorizedError,
} from '../utils/errors';
import { signupSchema } from '../schemas/auth.schema';

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  static async comparePasswords(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static async createUser(
    email: string,
    password: string,
  ): Promise<PublicUser> {
    const parsed = signupSchema.safeParse({ email, password });

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Invalid input';
      throw new ValidationError(message);
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    const hashedPassword = await this.hashPassword(password);

    return prisma.user.create({
      data: { email, password: hashedPassword },
      select: { id: true, email: true },
    });
  }

  static async findUserByEmail(email: string): Promise<AuthUser> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, password: true },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    return user;
  }

  static async loginUser(email: string, password: string): Promise<PublicUser> {
    const user = await this.findUserByEmail(email);
    const isPasswordValid = await this.comparePasswords(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    return { id: user.id, email: user.email };
  }

  static async getUserById(id: string): Promise<PublicUser> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true },
    });
    if (!user) {
      throw new UnauthorizedError('User not found');
    }
    return user;
  }
}
