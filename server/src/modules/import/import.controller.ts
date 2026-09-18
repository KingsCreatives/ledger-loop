import { Request, Response, RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { ImportService } from './import.service.js';
import { MatchingService } from '../reconciliation/matching.service.js';
import { commitImportSchema } from './import.schema.js';

export class ImportController {
  static parse: RequestHandler = asyncHandler(
    async (req: Request, res: Response) => {
      const file = req.file;

      if (!file) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: 'Failed to upload file',
        });
      }

      const contentHash = ImportService.computeContentHash(file.buffer);

      const { accountId } = req.body;
      const userId = req.session.userId!;

      const rows = await ImportService.parseCSV(file.buffer);
      const { validRows, errors } = ImportService.validateRows(rows);

      const matchResults = await MatchingService.classifyImportRows(
        validRows,
        accountId,
      );

      const batch = await ImportService.stageImport({
        userId,
        accountId,
        filename: file.originalname,
        validRows,
        contentHash,
        errors,
      });

      return res.status(StatusCodes.OK).json({
        batchId: batch.id,
        status: batch.status,
        validCount: validRows.length,
        errorCount: errors.length,
        matchResults,
        validRows,
        errors,
      });
    },
  );

  static commit: RequestHandler = asyncHandler(
    async (req: Request, res: Response) => {
      const validation = commitImportSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: 'Invalid import commit request',
        });
      }

      const { batchId, offsetAccountId, decisions } = validation.data;

      const result = await ImportService.commitImport(
        batchId,
        offsetAccountId,
        req.session.userId!,
        decisions,
      );

      return res.status(StatusCodes.OK).json(result);
    },
  );
}
