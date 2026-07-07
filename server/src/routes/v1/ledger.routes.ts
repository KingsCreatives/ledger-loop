import { Router } from 'express';
import { LedgerController } from '../../controllers/v1/ledger.controller';
import { requireAuth } from '../../middleware/auth.middleware';

const ledgerRouter: Router = Router();

ledgerRouter.use(requireAuth);
ledgerRouter.post('/', LedgerController.create);
ledgerRouter.get('/balance/:accountId', LedgerController.getBalance);
ledgerRouter.get('/accounts', LedgerController.getAccounts);
ledgerRouter.post('/accounts', LedgerController.createAccount);
ledgerRouter.get(
  '/accounts/:accountId/transactions',
  LedgerController.getAccountTransactions,
);

export default ledgerRouter;
