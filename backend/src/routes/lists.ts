import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getLists, renameList } from '../controllers/listsController';

const router = Router();

router.use(requireAuth);

router.get('/', getLists);
router.patch('/:id', renameList);

export default router;