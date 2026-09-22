import { describe, expect, it, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../../app.js';
import { prisma } from '../../../shared/utils/prisma.js';
import { AccountType, LineType } from '../../../../generated/prisma/client.js';

describe('AccountController reconciliation API', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should reconcile two matching transaction lines', async () => {
    const email = `api-test-${crypto.randomUUID()}@example.com`;
    const password = 'Password123!';

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: await import('bcrypt').then((bcrypt) =>
          bcrypt.default.hash(password, 10),
        ),
      },
    });

    // Create account
    const account = await prisma.account.create({
      data: {
        name: 'API Test Account',
        type: AccountType.ASSETS,
        userId: user.id,
      },
    });

    // Create target transaction
    const targetEntry = await prisma.journalEntry.create({
      data: {
        date: new Date('2026-09-01'),
        description: 'Bank transaction',
        lines: {
          create: {
            accountId: account.id,
            amount: 50000,
            type: LineType.DEBIT,
            isReconciled: false,
          },
        },
      },
      include: {
        lines: true,
      },
    });

    // Create candidate transaction
    const candidateEntry = await prisma.journalEntry.create({
      data: {
        date: new Date('2026-09-03'),
        description: 'Matching ledger transaction',
        lines: {
          create: {
            accountId: account.id,
            amount: 50000,
            type: LineType.DEBIT,
            isReconciled: false,
          },
        },
      },
      include: {
        lines: true,
      },
    });

    // Login to establish a real session
    const agent = request.agent(app);

    const loginResponse = await agent.post('/api/v1/auth/login').send({
      email,
      password,
    });

    expect(loginResponse.status).toBe(200);

    // Reconcile through the actual API
    const response = await agent
      .post(
        `/api/v1/accounts/${account.id}/reconciliation/${targetEntry.lines[0].id}/match`,
      )
      .send({
        candidateId: candidateEntry.lines[0].id,
      });

    expect(response.status).toBe(200);

    expect(response.body.lineId).toBe(targetEntry.lines[0].id);
    expect(response.body.candidateId).toBe(candidateEntry.lines[0].id);
    expect(response.body.reconciledAt).toBeDefined();

    // Verify database state
    const lines = await prisma.transactionLine.findMany({
      where: {
        id: {
          in: [targetEntry.lines[0].id, candidateEntry.lines[0].id],
        },
      },
    });

    expect(lines).toHaveLength(2);

    for (const line of lines) {
      expect(line.isReconciled).toBe(true);
      expect(line.reconciledAt).not.toBeNull();
    }
  });
});
