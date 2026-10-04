import { Router } from 'express';
import { SubscriptionController } from '../controllers/subscriptionController.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import {
  createSubscriptionSchema,
  updateSubscriptionSchema,
} from '../validators/subscriptionValidator.js';

const router = Router();

router.use(authenticate);

router.get('/', SubscriptionController.getAll);
router.post('/', validateRequest(createSubscriptionSchema), SubscriptionController.create);
router.put('/:id', validateRequest(updateSubscriptionSchema), SubscriptionController.update);
router.delete('/:id', SubscriptionController.delete);

export default router;
