import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ImportService } from '../../services/import.service';

export class ImportController {
  static async parse(req: Request, res: Response) {
    try {
      const file = req.file;

      if (!file) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: 'failed to upload file',
        });
      }
      const rows = await ImportService.parseCSV(file.buffer);

      return res.status(StatusCodes.OK).json({
        filename: file.originalname,
        rows,
      });
    } catch (error) {
      console.error(error);

      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: error instanceof Error ? error.message : error,
      });
    }
  }
}
