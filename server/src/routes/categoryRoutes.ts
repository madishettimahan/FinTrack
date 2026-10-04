import { Router } from 'express';
import { CategoryController } from '../controllers/categoryController.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { createCategorySchema, updateCategorySchema } from '../validators/categoryValidator.js';

const router = Router();

router.use(authenticate);

router.get('/', CategoryController.getAll);
router.post('/', validateRequest(createCategorySchema), CategoryController.create);
router.put('/:id', validateRequest(updateCategorySchema), CategoryController.update);
router.delete('/:id', CategoryController.delete);

export default router;
