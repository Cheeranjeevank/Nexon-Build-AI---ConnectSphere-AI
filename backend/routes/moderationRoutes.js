import express from 'express';
import {
  reportMessage,
  getReports,
  resolveReport,
  getModerationStats,
} from '../controllers/moderationController.js';
import { protect, moderatorOrAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/report', protect, reportMessage);
router.get('/reports', protect, moderatorOrAdmin, getReports);
router.put('/reports/:id/resolve', protect, moderatorOrAdmin, resolveReport);
router.get('/stats', protect, moderatorOrAdmin, getModerationStats);

export default router;

