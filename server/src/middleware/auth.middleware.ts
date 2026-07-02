import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.session.userId) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      message: 'Not authorized',
    });
  }
  next();
};
