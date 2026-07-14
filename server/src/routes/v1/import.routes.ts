import { Router } from 'express';
import { ImportController } from '../../controllers/v1/import.controller';
import { upload } from '../../utils/multer';

const importRouter: Router = Router();

importRouter.post('/parse', upload.single('file'), ImportController.parse);

export default importRouter;
