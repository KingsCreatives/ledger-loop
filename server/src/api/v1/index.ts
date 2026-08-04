import { Router } from 'express';
import ledgerRouter from '../../modules/ledger/ledger.routes';
import accountRouter from '../../modules/accounts/account.routes';
import authRouter from '../../modules/auth/auth.routes';
import importRouter from '../../modules/import/import.routes';

const v1Router: Router = Router();

v1Router.use('/ledger', ledgerRouter);
v1Router.use('/auth', authRouter);
v1Router.use('/accounts', accountRouter);
v1Router.use('/import', importRouter);

export default v1Router;
