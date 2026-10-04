import { Router } from 'express';
import { ReportController } from '../controllers/reportController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', ReportController.getReport);
router.get('/export/csv', ReportController.exportCsv);

export default router;
