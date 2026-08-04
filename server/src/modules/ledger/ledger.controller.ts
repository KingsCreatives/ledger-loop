import { Request, Response, RequestHandler } from 'express';
import { LedgerService } from './ledger.service';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../../shared/utils/asyncHandler';

export class LedgerController {
  static createEntry: RequestHandler = asyncHandler(
    async (req: Request, res: Response) => {
      const newEntry = await LedgerService.createEntry(
        req.body,
        req.session.userId!,
      );
      return res.status(StatusCodes.CREATED).json(newEntry);
    },
  );
}
