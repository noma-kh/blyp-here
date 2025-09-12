import { Router } from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import cafeRoutes from './cafeRoutes.js';
import reviewRoutes from './reviewRoutes.js';
import adminRoutes from './adminRoutes.js';
import badgeRoutes from './badgeRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/cafes', cafeRoutes);
router.use('/reviews', reviewRoutes);
router.use('/admin', adminRoutes);
router.use('/badges', badgeRoutes);

export default router;

