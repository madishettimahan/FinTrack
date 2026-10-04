import { Router } from 'express';
import { TransactionController } from '../controllers/transactionController.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import {
  createTransactionSchema,
  updateTransactionSchema,
  getTransactionSchema,
  queryTransactionsSchema,
} from '../validators/transactionValidator.js';

const router = Router();

router.use(authenticate);

router.get('/', validateRequest(queryTransactionsSchema), TransactionController.getAll);
router.post('/', validateRequest(createTransactionSchema), TransactionController.create);
router.get('/:id', validateRequest(getTransactionSchema), TransactionController.getById);
router.put('/:id', validateRequest(updateTransactionSchema), TransactionController.update);
router.delete('/:id', validateRequest(getTransactionSchema), TransactionController.delete);

export default router;
