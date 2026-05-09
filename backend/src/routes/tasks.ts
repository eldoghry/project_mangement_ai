import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  createTask,
  updateTask,
  deleteTask,
  moveTask,
  reorderTasks,
} from '../controllers/tasksController';

const router = Router();

router.use(requireAuth);

router.post('/', createTask);
router.patch('/reorder', reorderTasks);
router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);
router.patch('/:id/move', moveTask);

export default router;