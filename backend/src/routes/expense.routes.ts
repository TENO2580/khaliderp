import { Router } from 'express';
import { expenseController } from '../controllers/expense.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';

const router = Router();
router.use(authenticate);

router.get('/', authorize('expenses:read'), expenseController.getAll);
router.get('/stats', authorize('expenses:read'), expenseController.getStats);
router.get('/categories', authorize('expenses:read'), expenseController.getCategories);
router.post('/', authorize('expenses:create'), expenseController.create);
router.patch('/:id/approve', authorize('expenses:update'), expenseController.approve);

export default router;
