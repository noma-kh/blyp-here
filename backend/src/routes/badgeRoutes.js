import { Router } from 'express';
import { listBadges, listUserBadges } from '../controllers/badgeController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.get('/', listBadges);
router.get('/me', protect, listUserBadges);

export default router;

