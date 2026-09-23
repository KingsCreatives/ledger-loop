import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../../../shared/utils/prisma.js';
import { MatchingService } from '../matching.service.js';
import { LineType } from '../../../../generated/prisma/enums.js';


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

  it('should find unreconciled candidates matching amount, type, and date tolerance', async () => {
    const entry = await prisma.journalEntry.create({
      data: {
        date: new Date('2026-09-03'),
        description: 'Matching candidate',
        lines: {
          create: [
            {
              accountId,
              amount: 50000,
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

    // Outside the 5-day tolerance
    await prisma.journalEntry.create({
      data: {
        date: new Date('2026-09-15'),
        description: 'Outside date range',
        lines: {
          create: [
            {
              accountId,
              amount: 50000,
              type: 'DEBIT',
              isReconciled: false,
            },
          ],
        },
      },
    });

    // Same amount/date but already reconciled
    await prisma.journalEntry.create({
      data: {
        date: new Date('2026-09-03'),
        description: 'Already reconciled',
        lines: {
          create: [
            {
              accountId,
              amount: 50000,
              type: 'DEBIT',
              isReconciled: true,
              reconciledAt: new Date(),
            },
          ],
        },
      },
    });

    const results = await MatchingService.findCandidatesByCriteria(
      accountId,
      50000,
      LineType.DEBIT,
      new Date('2026-09-01'),
    );

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe(entry.lines[0].id);
    expect(results[0].journalEntryLine.description).toBe('Matching candidate');
  });

  it('should find matching candidates for an outstanding transaction line', async () => {
    const targetEntry = await prisma.journalEntry.create({
      data: {
        date: new Date('2026-09-01'),
        description: 'Bank transaction',
        lines: {
          create: [
            {
              accountId,
              amount: 50000,
              type: LineType.DEBIT,
              isReconciled: false,
            },
          ],
        },
      },
      include: {
        lines: true,
      },
    });

    const candidateEntry = await prisma.journalEntry.create({
      data: {
        date: new Date('2026-09-03'),
        description: 'Matching ledger transaction',
        lines: {
          create: [
            {
              accountId,
              amount: 50000,
              type: LineType.DEBIT,
              isReconciled: false,
            },
          ],
        },
      },
      include: {
        lines: true,
      },
    });

    const result = await MatchingService.findMatchesForLine(
      targetEntry.lines[0].id,
      accountId,
    );

    expect(result).not.toBeNull();

    expect(result?.line.id).toBe(targetEntry.lines[0].id);

    expect(result?.candidates).toHaveLength(1);

    expect(result?.candidates[0].id).toBe(candidateEntry.lines[0].id);

    expect(result?.candidates[0].journalEntryLine.description).toBe(
      'Matching ledger transaction',
    );

    expect(
      result?.candidates.some(
        (candidate: { id: string; }) => candidate.id === targetEntry.lines[0].id,
      ),
    ).toBe(false);
  });

  it('should reconcile two matching transaction lines', async () => {
    const targetEntry = await prisma.journalEntry.create({
      data: {
        date: new Date('2026-09-01'),
        description: 'Bank transaction',
        lines: {
          create: [
            {
              accountId,
              amount: 50000,
              type: LineType.DEBIT,
              isReconciled: false,
            },
          ],
        },
      },
      include: {
        lines: true,
      },
    });

    const candidateEntry = await prisma.journalEntry.create({
      data: {
        date: new Date('2026-09-03'),
        description: 'Matching ledger transaction',
        lines: {
          create: [
            {
              accountId,
              amount: 50000,
              type: LineType.DEBIT,
              isReconciled: false,
            },
          ],
        },
      },
      include: {
        lines: true,
      },
    });

    const result = await MatchingService.reconcileLines(
      accountId,
      targetEntry.lines[0].id,
      candidateEntry.lines[0].id,
    );

    expect(result).not.toBeNull();
    expect(result?.lineId).toBe(targetEntry.lines[0].id);
    expect(result?.candidateId).toBe(candidateEntry.lines[0].id);
    expect(result?.reconciledAt).toBeInstanceOf(Date);

    const reconciledLines = await prisma.transactionLine.findMany({
      where: {
        id: {
          in: [targetEntry.lines[0].id, candidateEntry.lines[0].id],
        },
      },
    });

    expect(reconciledLines).toHaveLength(2);

    for (const line of reconciledLines) {
      expect(line.isReconciled).toBe(true);
      expect(line.reconciledAt).not.toBeNull();
    }
  });

  it('should not reconcile lines that do not match', async () => {
    const targetEntry = await prisma.journalEntry.create({
      data: {
        date: new Date('2026-09-01'),
        description: 'Bank transaction',
        lines: {
          create: [
            {
              accountId,
              amount: 50000,
              type: LineType.DEBIT,
              isReconciled: false,
            },
          ],
        },
      },
      include: {
        lines: true,
      },
    });

    const candidateEntry = await prisma.journalEntry.create({
      data: {
        date: new Date('2026-09-03'),
        description: 'Wrong amount transaction',
        lines: {
          create: [
            {
              accountId,
              amount: 75000,
              type: LineType.DEBIT,
              isReconciled: false,
            },
          ],
        },
      },
      include: {
        lines: true,
      },
    });

    const result = await MatchingService.reconcileLines(
      accountId,
      targetEntry.lines[0].id,
      candidateEntry.lines[0].id,
    );

    expect(result).toBeNull();

    const lines = await prisma.transactionLine.findMany({
      where: {
        id: {
          in: [targetEntry.lines[0].id, candidateEntry.lines[0].id],
        },
      },
    });

    expect(lines).toHaveLength(2);

    for (const line of lines) {
      expect(line.isReconciled).toBe(false);
      expect(line.reconciledAt).toBeNull();
    }
  });
});
