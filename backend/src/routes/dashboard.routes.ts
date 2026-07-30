import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';

const router = Router();
router.use(authenticate);

router.get('/kpis', authorize('dashboard:read'), dashboardController.getKPIs);
router.get('/charts', authorize('dashboard:read'), dashboardController.getChartData);

export default router;
