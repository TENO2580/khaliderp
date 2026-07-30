import { Router } from 'express';
import { customerController } from '../controllers/customer.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { createCustomerSchema, updateCustomerSchema, createFollowupSchema, customerQuerySchema } from '../validators/customer.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', authorize('customers:read'), validate(customerQuerySchema, 'query'), customerController.getAll);
router.get('/stats', authorize('customers:read'), customerController.getStats);
router.get('/followups/due', authorize('customers:read'), customerController.getDueFollowups);
router.get('/:id', authorize('customers:read'), customerController.getById);
router.post('/', authorize('customers:create'), validate(createCustomerSchema), customerController.create);
router.put('/:id', authorize('customers:update'), validate(updateCustomerSchema), customerController.update);
router.delete('/:id', authorize('customers:delete'), customerController.delete);
router.post('/followups', authorize('customers:create'), validate(createFollowupSchema), customerController.addFollowup);

export default router;
