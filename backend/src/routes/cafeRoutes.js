import { Router } from 'express';
import { listCafes, getCafe } from '../controllers/cafeController.js';

const router = Router();
router.get('/', listCafes);
router.get('/:id', getCafe);

export default router;

