import { Router } from 'express';
import { LedgerController } from './ledger.controller';
import { requireAuth } from '../../shared/middleware/auth.middleware';

const ledgerRouter: Router = Router();

ledgerRouter.use(requireAuth);
ledgerRouter.post('/', LedgerController.createEntry);

export default ledgerRouter;
