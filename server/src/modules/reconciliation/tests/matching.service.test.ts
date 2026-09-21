import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../../../shared/utils/prisma.js';
import { MatchingService } from '../matching.service.js';

describe('MatchingService.getOutstandingItems', () => {
  let userId: string;
  let accountId: string;

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: {
        email: `reconciliation-test-${Date.now()}@example.com`,
        password: 'test-password',
      },
    });

    userId = user.id;

    const account = await prisma.account.create({
      data: {
        name: 'Test Bank Account',
        type: 'ASSETS',
        userId,
      },
    });

    accountId = account.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should return only unreconciled transaction lines for the account', async () => {
    const entry = await prisma.journalEntry.create({
      data: {
        date: new Date('2026-09-01'),
        description: 'Outstanding transaction',
        lines: {
          create: [
            {
              accountId,
              amount: 500000,
              type: 'DEBIT',
              isReconciled: false,
            },
          ],
        },
      },
      include: {
        lines: true,
      },
    });

    const reconciledEntry = await prisma.journalEntry.create({
      data: {
        date: new Date('2026-09-02'),
        description: 'Reconciled transaction',
        lines: {
          create: [
            {
              accountId,
              amount: 250000,
              type: 'DEBIT',
              isReconciled: true,
              reconciledAt: new Date(),
            },
          ],
        },
      },
      include: {
        lines: true,
      },
    });

    const results = await MatchingService.getOutstandingItems(accountId);

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe(entry.lines[0].id);
    expect(results[0].isReconciled).toBe(false);
    expect(results[0].journalEntryLine.description).toBe(
      'Outstanding transaction',
    );

    expect(
      results.some((line: { id: any; }) => line.id === reconciledEntry.lines[0].id),
    ).toBe(false);
  });
});
