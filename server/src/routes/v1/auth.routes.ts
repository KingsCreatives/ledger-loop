import { Router } from 'express';
import { AuthController } from '../../controllers/v1/auth.controller';

const authRouter: Router = Router();

authRouter.post('/signup', AuthController.create);

export default authRouter;
