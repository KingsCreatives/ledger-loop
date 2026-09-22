import { Router } from 'express';
import { AccountController } from './account.controller.js';
import { requireAuth } from '../../shared/middleware/auth.middleware.js';

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
accountRouter.get(
  '/:accountId/reconciliation',
  AccountController.getAccountReconciliation,
);
accountRouter.get(
  '/:accountId/reconciliation/:lineId/matches',
  AccountController.getAccountReconciliationMatches,
);

export default accountRouter;
