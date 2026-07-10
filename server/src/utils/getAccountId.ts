import { Request } from "express";
import { ValidationError } from "./errors";

export function getAccountId(req: Request): string {
  const { accountId } = req.params;

  if (typeof accountId !== 'string') {
    throw new ValidationError('Invalid account ID.');
  }

  return accountId;
}
