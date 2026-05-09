import { Router } from 'express';
import { login, register, logout } from '../controllers/authController';

const router = Router();

router.post('/login', (req, res, next) => {
  login(req, res).catch(next);
});
router.post('/register', (req, res, next) => {
  register(req, res).catch(next);
});
router.post('/logout', logout);

export default router;