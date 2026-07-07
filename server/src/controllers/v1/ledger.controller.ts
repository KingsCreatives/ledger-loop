import { Request, Response } from 'express';
import { LedgerService } from '../../services/ledger.service';
import {createAccountSchema} from '../../schemas/account.schema';
import { AccountType } from '../../../generated/prisma/enums';
import { StatusCodes } from 'http-status-codes';

export class LedgerController {
  static async create(req: Request, res: Response) {
    try {
      const newEntry = await LedgerService.createEntry(
        req.body,
        req.session.userId!,
      );
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
      const accountBalance = await LedgerService.getAccountBalance(
        accountId,
        req.session.userId!,
      );
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

  static async getAccounts(req: Request, res: Response) {
    try {
      const accounts = await LedgerService.listAccounts(req.session.userId!);
      return res.status(StatusCodes.OK).json(accounts);
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      });
    }
  }

  static async createAccount(req: Request, res: Response) {
    try {
      
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
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      });
    }
  }

  static async getAccountTransactions(req: Request, res: Response) {
    try {
      const { accountId } = req.params;
      const transactions = await LedgerService.getAccountTransactions(
        accountId,
        req.session.userId!,
      );
      return res.status(StatusCodes.OK).json(transactions);
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
