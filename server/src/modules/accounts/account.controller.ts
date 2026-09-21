import { Request, Response, RequestHandler } from 'express';
import { AccountService } from './account.service.js';
import { createAccountSchema } from './account.schema.js';
import { AccountType } from '../../../generated/prisma/enums.js';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { getAccountId } from '../../shared/utils/getAccountId.js';
import { MatchingService } from '../reconciliation/matching.service.js';

export class AccountController {
  static createAccount: RequestHandler = asyncHandler(
    async (req: Request, res: Response) => {
      const parsed = createAccountSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: parsed.error.issues[0]?.message ?? 'Invalid input',
        });
      }

      const account = await AccountService.createAccount(
        parsed.data.name,
        parsed.data.type as AccountType,
        req.session.userId!,
      );
      return res.status(StatusCodes.CREATED).json(account);
    },
  );

  static getAccounts: RequestHandler = asyncHandler(
    async (req: Request, res: Response) => {
      const accounts = await AccountService.listAccounts(req.session.userId!);
      return res.status(StatusCodes.OK).json(accounts);
    },
  );

  static getAccountBalance: RequestHandler = asyncHandler(
    async (req: Request, res: Response) => {
      const accountId = getAccountId(req);
      const accountBalance = await AccountService.getAccountBalance(
        accountId,
        req.session.userId!,
      );
      return res.status(StatusCodes.OK).json({
        accountId: req.params.accountId,
        balance: accountBalance,
      });
    },
  );

  static getAccountDetails: RequestHandler = asyncHandler(
    async (req: Request, res: Response) => {
      const accountId = getAccountId(req);
      const details = await AccountService.getAccountInfo(
        accountId,
        req.session.userId!,
      );

      return res.status(StatusCodes.OK).json(details);
    },
  );

  static getAccountTransactions: RequestHandler = asyncHandler(
    async (req: Request, res: Response) => {
      const accountId = getAccountId(req);
      const transactions = await AccountService.getAccountTransactions(
        accountId,
        req.session.userId!,
      );
      return res.status(StatusCodes.OK).json(transactions);
    },
  );

  static getAccountReconciliation: RequestHandler = asyncHandler(
    async (req: Request, res: Response) => {
      const accountId = getAccountId(req);

      await AccountService.getAccountInfo(accountId, req.session.userId!);

      const outstandingItems =
        await MatchingService.getOutstandingItems(accountId);

      return res.status(StatusCodes.OK).json(outstandingItems);
    },
  );
}
