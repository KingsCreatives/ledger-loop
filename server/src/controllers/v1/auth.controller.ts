import { Request, Response } from 'express';
import { AuthService } from '../../services/auth.service';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '../../utils/errors';
export class AuthController {
  static async create(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const newUser = await AuthService.createUser(email, password);
      return res.status(StatusCodes.CREATED).json(newUser);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: 'An unexpected error occurred',
      });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const user = await AuthService.loginUser(email, password);
      req.session.userId = user.id;
      return res.status(StatusCodes.OK).json(user);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: 'An unexpected error occurred',
      });
    }
  }
}
