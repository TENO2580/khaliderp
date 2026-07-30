import { Router } from 'express';
import { employeeController } from '../controllers/employee.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';

const router = Router();
router.use(authenticate);

router.get('/', authorize('employees:read'), employeeController.getAll);
router.get('/attendance/stats', authorize('employees:read'), employeeController.getAttendanceStats);
router.get('/:id', authorize('employees:read'), employeeController.getById);
router.post('/', authorize('employees:create'), employeeController.create);
router.put('/:id', authorize('employees:update'), employeeController.update);
router.post('/attendance', authorize('attendance:create'), employeeController.markAttendance);
router.get('/:employeeId/attendance', authorize('attendance:read'), employeeController.getAttendance);

export default router;
