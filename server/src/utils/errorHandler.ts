import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '../utils/errors';

export const errorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  return res.status(StatusCodes.BAD_REQUEST).json({
    message:
      error instanceof Error ? error.message : 'An unexpected error occurred',
  });
};
