import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { profile } from '../controllers/userController.js';

const router = Router();
router.get('/me', protect, profile);

export default router;

