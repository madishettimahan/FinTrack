import { Router } from 'express';
import { GoalController } from '../controllers/goalController.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import {
  createGoalSchema,
  updateGoalSchema,
  adjustGoalMoneySchema,
} from '../validators/goalValidator.js';

const router = Router();

router.use(authenticate);

router.get('/', GoalController.getAll);
router.post('/', validateRequest(createGoalSchema), GoalController.create);
router.get('/:id', GoalController.getById);
router.put('/:id', validateRequest(updateGoalSchema), GoalController.update);
router.post('/:id/adjust', validateRequest(adjustGoalMoneySchema), GoalController.adjustMoney);
router.delete('/:id', GoalController.delete);

export default router;
