import { Router } from 'express';
import { ImportController } from './import.controller';
import { upload } from '../../shared/utils/multer';

const importRouter: Router = Router();

importRouter.post('/parse', upload.single('file'), ImportController.parse);
importRouter.post('/commit', ImportController.commit);

export default importRouter;
