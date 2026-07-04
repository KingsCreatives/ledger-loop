import { Router } from 'express';
import { AuthController } from '../../controllers/v1/auth.controller';
import { requireAuth } from '../../middleware/auth.middleware';

const authRouter: Router = Router();

authRouter.post('/signup', AuthController.create);
authRouter.post('/login', AuthController.login);
authRouter.post('/logout', AuthController.logout);
authRouter.get('/me', requireAuth, AuthController.me);

export default authRouter;
