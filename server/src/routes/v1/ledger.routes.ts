import { Router } from "express";
import { LedgerController } from "../../controllers/v1/ledger.controller";

const ledgerRouter: Router = Router()

ledgerRouter.post('/', LedgerController.create)

export default ledgerRouter;