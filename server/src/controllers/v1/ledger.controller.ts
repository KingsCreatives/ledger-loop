import { Request, Response } from 'express';
import { LedgerService } from '../../services/ledger.service';
import { StatusCodes } from 'http-status-codes';

export class LedgerController {
  static async create(req: Request, res: Response) {
    try {
      const newEntry = await LedgerService.createEntry(req.body);
      return res.status(StatusCodes.CREATED).json(newEntry);
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      });
    }
  }

  static async getBalance(req: Request, res: Response) {
    try {
      const { accountId } = req.params;

      if (!accountId || typeof accountId !== 'string') {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: 'A valid Account ID must be provided in the URL',
        });
      }
      const accountBalance = await LedgerService.getAccountBalance(accountId);
      return res.status(StatusCodes.OK).json({
        accountId,
        balance: accountBalance,
      });
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      });
    }
  }
}
