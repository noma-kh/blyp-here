import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { createReview, getReviews } from '../controllers/reviewController.js';

const router = Router();
router.get('/:cafeId', getReviews);
router.post('/', protect, createReview);

export default router;

