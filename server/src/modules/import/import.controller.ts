import { Request, Response, RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { ImportService } from './import.service';

export class ImportController {
  static parse: RequestHandler = asyncHandler(
    async (req: Request, res: Response) => {
      const file = req.file;

      if (!file) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: 'Failed to upload file',
        });
      }

      const { accountId } = req.body;
      const userId = req.session.userId!;

      const rows = await ImportService.parseCSV(file.buffer);
      const { validRows, errors } = ImportService.validateRows(rows);

      const batch = await ImportService.stageImport({
        userId,
        accountId,
        filename: file.originalname,
        validRows,
        errors,
      });

      return res.status(StatusCodes.OK).json({
        batchId: batch.id,
        status: batch.status,
        validCount: validRows.length,
        errorCount: errors.length,
        validRows,
        errors,
      });
    },
  );

  static commit: RequestHandler = asyncHandler(
    async (req: Request, res: Response) => {
      const { batchId, offsetAccountId } = req.body;

      const result = await ImportService.commitImport(
        batchId,
        offsetAccountId,
        req.session.userId!,
      );

      return res.status(StatusCodes.OK).json(result);
    },
  );
}
