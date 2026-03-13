import { Router } from "express";
import ledgerRouter from "./ledger.routes";

const v1Router: Router = Router()

v1Router.use('/ledger', ledgerRouter)

export default v1Router