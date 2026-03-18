import { Router } from 'express';
import { LedgerController } from '../../controllers/v1/ledger.controller';

const ledgerRouter: Router = Router();

ledgerRouter.post('/', LedgerController.create);
(ledgerRouter.get('/balance/:accountId', LedgerController.getBalance),
  ledgerRouter.get('/accounts', LedgerController.getAccounts));

export default ledgerRouter;
