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
}
