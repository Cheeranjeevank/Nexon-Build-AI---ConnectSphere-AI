import express from 'express';
import {
  summarizeChat,
  askAssistant,
  suggestTopics,
  scanModeration,
  recommendCommunities,
  getAIStatus,
} from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/status', getAIStatus);
router.post('/summarize', summarizeChat);
router.post('/ask', askAssistant);
router.post('/suggest-topics', suggestTopics);
router.post('/moderate', scanModeration);
router.post('/scan-moderation', scanModeration);
router.get('/recommend-communities', protect, recommendCommunities);

export default router;

