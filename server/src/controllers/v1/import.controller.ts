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

      const userId = req.session.userId!;
      const {accountId} = req.body

      const rows = await ImportService.parseCSV(file.buffer);
      const { validRows, errors } = ImportService.validateRows(rows);

      const batch = await ImportService.stageImport({
        userId,
        accountId,
        filename : file.originalname,
        validRows,
        errors
      })

      return res.status(StatusCodes.OK).json({
        batchId: batch.id,
        status: batch.status,
        validCount: validRows.length,
        errorCount: errors.length,
        errors,
      });
    } catch (error) {
      console.error(error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: error instanceof Error ? error.message : error,
      });
    }
  }
}
