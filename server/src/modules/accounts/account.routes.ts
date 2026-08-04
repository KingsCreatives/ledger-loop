import { Router } from 'express';
import { AccountController } from './account.controller';
import { requireAuth } from '../../shared/middleware/auth.middleware';

const accountRouter: Router = Router();

accountRouter.use(requireAuth);

accountRouter.get('/', AccountController.getAccounts);
accountRouter.post('/', AccountController.createAccount);
accountRouter.get('/:accountId', AccountController.getAccountDetails);
accountRouter.get('/:accountId/balance', AccountController.getAccountBalance);
accountRouter.get(
  '/:accountId/transactions',
  AccountController.getAccountTransactions,
);

export default accountRouter;
