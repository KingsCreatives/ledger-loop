import { Router } from 'express';
import ledgerRouter from './ledger.routes';
import authRouter from './auth.routes';
import importRouter from './import.routes';

const v1Router: Router = Router();

v1Router.use('/ledger', ledgerRouter);
v1Router.use('/auth', authRouter);
v1Router.use('/ledger/import', importRouter);

export default v1Router;
