import { Router } from 'express';
import { productionController } from '../controllers/production.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { createProductionSchema, createBatchSchema } from '../validators/production.validator';

const router = Router();
router.use(authenticate);

// Production entries
router.get('/', authorize('production:read'), productionController.getAll);
router.get('/stats', authorize('production:read'), productionController.getStats);
router.get('/:id', authorize('production:read'), productionController.getById);
router.post('/', authorize('production:create'), validate(createProductionSchema), productionController.create);

// Batch management
router.get('/batches/list', authorize('batch:read'), productionController.getAllBatches);
router.get('/batches/:id', authorize('batch:read'), productionController.getBatchById);
router.post('/batches', authorize('batch:create'), validate(createBatchSchema), productionController.createBatch);

export default router;
