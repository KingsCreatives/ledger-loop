import { describe, expect, it } from 'vitest';
import { ImportService } from '../import.service.js';

describe('ImportService.parseCSV', () => {
  it('should parse a valid CSV into rows', async () => {
    const csv = [
      'date,description,amount',
      '2026-08-01,Salary,5000',
      '2026-08-02,Rent,-1200',
    ].join('\n');

    const result = await ImportService.parseCSV(Buffer.from(csv));

    expect(result).toHaveLength(2);

    expect(result[0]).toEqual({
      date: '2026-08-01',
      description: 'Salary',
      amount: '5000',
    });

    expect(result[1]).toEqual({
      date: '2026-08-02',
      description: 'Rent',
      amount: '-1200',
    });
  });

  it('should return an empty array for an empty CSV', async () => {
    const result = await ImportService.parseCSV(Buffer.from(''));

    expect(result).toEqual([]);
  });

  it('should parse multiple rows correctly', async () => {
    const csv = [
      'date,description,amount',
      '2026-08-01,Salary,5000',
      '2026-08-02,Rent,-1200',
      '2026-08-03,Transport,-300',
    ].join('\n');

    const result = await ImportService.parseCSV(Buffer.from(csv));

    expect(result).toHaveLength(3);
  });
});

describe('ImportService.validateRows', () => {
  it('should return valid rows when all rows are valid', async () => {
    const rows = [
      {
        date: '2026-08-01',
        description: 'Salary',
        amount: '5000',
      },
    ];

    const result = await ImportService.validateRows(rows);

    expect(result.validRows).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
  });

  it('should return an error for an invalid row', async () => {
    const rows = [
      {
        date: 'invalid-date',
        description: 'Salary',
        amount: '5000',
      },
    ];

    const result = await ImportService.validateRows(rows);

    expect(result.validRows).toHaveLength(0);
    expect(result.errors).toHaveLength(1);

    const firstError = result.errors.at(0);
    expect(firstError).toBeDefined();
    if (!firstError) throw new Error('Expected a validation error');
    expect(firstError.row).toBe(1);
  });

  it('should handle mixed valid and invalid rows', async () => {
    const rows = [
      {
        date: '2026-08-01',
        description: 'Salary',
        amount: '5000',
      },
      {
        date: 'invalid-date',
        description: 'Bad transaction',
        amount: '500',
      },
    ];

    const result = await ImportService.validateRows(rows);

    expect(result.validRows).toHaveLength(1);
    expect(result.errors).toHaveLength(1);

    const firstError = result.errors.at(0);
    expect(firstError).toBeDefined();
    if (!firstError) throw new Error('Expected a validation error');
    expect(firstError.row).toBe(2);
  });

  it('should transform amount from major units to cents', async () => {
    const rows = [
      {
        date: '2026-08-01',
        description: 'Salary',
        amount: '5000.50',
      },
    ];

    const result = await ImportService.validateRows(rows);

    expect(result.validRows).toHaveLength(1);
    expect(result.validRows.at(0)?.amount).toBe(500050);
  });
});