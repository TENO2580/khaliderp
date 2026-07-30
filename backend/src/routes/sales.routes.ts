import { Router } from 'express';
import { salesController } from '../controllers/sales.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { createSalesOrderSchema, updateOrderStatusSchema, createPaymentSchema } from '../validators/sales.validator';

const router = Router();
router.use(authenticate);

router.get('/', authorize('sales:read'), salesController.getAll);
router.get('/stats', authorize('sales:read'), salesController.getStats);
router.get('/:id', authorize('sales:read'), salesController.getById);
router.post('/', authorize('sales:create'), validate(createSalesOrderSchema), salesController.create);
router.patch('/:id/status', authorize('sales:update'), validate(updateOrderStatusSchema), salesController.updateStatus);
router.post('/:id/invoice', authorize('invoices:create'), salesController.generateInvoice);
router.post('/payments', authorize('payments:create'), validate(createPaymentSchema), salesController.recordPayment);

export default router;
