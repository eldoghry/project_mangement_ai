import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { handleChat } from '../controllers/aiController';

const router = Router();

router.use(requireAuth);
router.post('/chat', handleChat);

export default router;