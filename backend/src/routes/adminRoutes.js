import { Router } from 'express';
import { protect, requireAdmin } from '../middleware/auth.js';
import { listSuggestions, approveSuggestion, rejectSuggestion, submitSuggestion } from '../controllers/adminController.js';

const router = Router();

// user-submitted suggestions/claims
router.post('/suggestions', protect, submitSuggestion);

// admin moderation
router.get('/suggestions', protect, requireAdmin, listSuggestions);
router.post('/suggestions/:id/approve', protect, requireAdmin, approveSuggestion);
router.post('/suggestions/:id/reject', protect, requireAdmin, rejectSuggestion);

export default router;

