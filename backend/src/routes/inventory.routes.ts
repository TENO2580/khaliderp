import { Router } from 'express';
import { inventoryController } from '../controllers/inventory.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';

const router = Router();
router.use(authenticate);

router.get('/', authorize('inventory:read'), inventoryController.getAll);
router.get('/stats', authorize('inventory:read'), inventoryController.getStats);
router.get('/alerts', authorize('inventory:read'), inventoryController.getLowStockAlerts);
router.get('/raw-materials', authorize('raw_materials:read'), inventoryController.getRawMaterials);
router.post('/raw-materials', authorize('raw_materials:create'), inventoryController.upsertRawMaterial);
router.put('/raw-materials', authorize('raw_materials:update'), inventoryController.upsertRawMaterial);
router.post('/adjust', authorize('inventory:update'), inventoryController.adjustStock);
router.get('/movements', authorize('stock_movements:read'), inventoryController.getStockMovements);

export default router;
