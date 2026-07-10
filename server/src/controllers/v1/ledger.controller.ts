import { Request, Response, RequestHandler } from 'express';
import { LedgerService } from '../../services/ledger.service';
import { createAccountSchema } from '../../schemas/account.schema';
import { AccountType } from '../../../generated/prisma/enums';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../../utils/asyncHandler';

export class LedgerController {
  
  static create: RequestHandler = asyncHandler(
    async (req: Request, res: Response) => {
      const newEntry = await LedgerService.createEntry(
        req.body,
        req.session.userId!,
      );
      return res.status(StatusCodes.CREATED).json(newEntry);
    },
  );

  static createAccount: RequestHandler = asyncHandler(
    async (req: Request, res: Response) => {
      const parsed = createAccountSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: parsed.error.issues[0]?.message ?? 'Invalid input',
        });
      }

      const account = await LedgerService.createAccount(
        parsed.data.name,
        parsed.data.type as AccountType,
        req.session.userId!,
      );
      return res.status(StatusCodes.CREATED).json(account);
    },
  );

  static getAccounts: RequestHandler = asyncHandler(
    async (req: Request, res: Response) => {
      const accounts = await LedgerService.listAccounts(req.session.userId!);
      return res.status(StatusCodes.OK).json(accounts);
    },
  );

  static getBalance: RequestHandler = asyncHandler(
    async (req: Request, res: Response) => {
      const { accountId } = req.params;

      if (!accountId || typeof accountId !== 'string') {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: 'A valid Account ID must be provided in the URL',
        });
      }

      const accountBalance = await LedgerService.getAccountBalance(
        accountId,
        req.session.userId!,
      );
      return res.status(StatusCodes.OK).json({
        accountId,
        balance: accountBalance,
      });
    },
  );

  static getAccountDetails: RequestHandler = asyncHandler(
    async (req: Request, res: Response) => {
      const { accountId } = req.params;

      if (!accountId || typeof accountId !== 'string') {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: 'A valid Account ID must be provided in the URL',
        });
      }

      const details = await LedgerService.getAccountInfo(
        accountId,
        req.session.userId!,
      );

      return res.status(StatusCodes.OK).json({
        accountId,
        name: details.name,
        type: details.type,
        balance: details.balance,
      });
    },
  );

  static getAccountTransactions: RequestHandler = asyncHandler(
    async (req: Request, res: Response) => {
      const { accountId } = req.params;

      if (!accountId || typeof accountId !== 'string') {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: 'A valid Account ID must be provided in the URL',
        });
      }

      const transactions = await LedgerService.getAccountTransactions(
        accountId,
        req.session.userId!,
      );
      return res.status(StatusCodes.OK).json(transactions);
    },
  );
}
