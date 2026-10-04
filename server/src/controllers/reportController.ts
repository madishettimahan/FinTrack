import { Request, Response, NextFunction } from 'express';
import { ReportService } from '../services/reportService.js';
import { sendSuccess } from '../utils/response.js';

export class ReportController {
  static async getReport(req: Request, res: Response, next: NextFunction) {
    try {
      const range = (req.query.range as string) || 'this-month';
      const customStart = req.query.startDate as string | undefined;
      const customEnd = req.query.endDate as string | undefined;

      const report = await ReportService.generateReport(req.user!.id, range, customStart, customEnd);
      return sendSuccess(res, report, 'Report generated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async exportCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const range = (req.query.range as string) || 'this-month';
      const customStart = req.query.startDate as string | undefined;
      const customEnd = req.query.endDate as string | undefined;

      const csvData = await ReportService.exportToCsv(req.user!.id, range, customStart, customEnd);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="finance-report-${range}-${Date.now()}.csv"`);
      return res.status(200).send(csvData);
    } catch (error) {
      next(error);
    }
  }
}
