import { Router } from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import cafeRoutes from './cafeRoutes.js';
import reviewRoutes from './reviewRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/cafes', cafeRoutes);
router.use('/reviews', reviewRoutes);

export default router;

