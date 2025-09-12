import { Router } from 'express';
import { listCafes, getCafe, createCafe, updateCafe } from '../controllers/cafeController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.get('/', listCafes);
router.get('/:id', getCafe);
router.post('/', protect, createCafe);
router.put('/:id', protect, updateCafe);

export default router;

