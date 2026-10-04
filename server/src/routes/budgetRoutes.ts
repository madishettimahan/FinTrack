import { Router } from 'express';
import { BudgetController } from '../controllers/budgetController.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { createBudgetSchema, updateBudgetSchema } from '../validators/budgetValidator.js';

const router = Router();

router.use(authenticate);

router.get('/', BudgetController.getAll);
router.post('/', validateRequest(createBudgetSchema), BudgetController.create);
router.put('/:id', validateRequest(updateBudgetSchema), BudgetController.update);
router.delete('/:id', BudgetController.delete);

export default router;
