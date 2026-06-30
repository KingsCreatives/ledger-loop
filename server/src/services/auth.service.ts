import bcrypt from 'bcrypt';
import { prisma } from '../utils/prisma';
import { PublicUser } from '../types';
import { ValidationError, ConflictError } from '../utils/errors';
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
      throw new ValidationError(parsed.error.issues[0].message);
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
}
