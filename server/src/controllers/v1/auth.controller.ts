import { Request, Response, RequestHandler } from 'express';
import { AuthService } from '../../services/auth.service';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../../utils/asyncHandler';

export class AuthController {
  
  static create: RequestHandler = asyncHandler(
    async (req: Request, res: Response) => {
      const { email, password } = req.body;
      const newUser = await AuthService.createUser(email, password);
      return res.status(StatusCodes.CREATED).json(newUser);
    },
  );

  static me: RequestHandler = asyncHandler(
    async (req: Request, res: Response) => {
      const user = await AuthService.getUserById(req.session.userId!);
      return res.status(StatusCodes.OK).json(user);
    },
  );

  static login: RequestHandler = asyncHandler(
    async (req: Request, res: Response) => {
      const { email, password } = req.body;
      const user = await AuthService.loginUser(email, password);
      req.session.userId = user.id;
      return res.status(StatusCodes.OK).json(user);
    },
  );

  static logout: RequestHandler = (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          message: 'Logout failed',
        });
      }
      res.clearCookie('connect.sid');
      return res.status(StatusCodes.OK).json({
        message: 'Logged out successfully',
      });
    });
  };
}
