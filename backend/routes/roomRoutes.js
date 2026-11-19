import express from 'express';
import {
  getRoomsByCommunity,
  getRoomById,
  createRoom,
  joinRoom,
  leaveRoom,
} from '../controllers/roomController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/community/:communityId', getRoomsByCommunity);
router.get('/:id', getRoomById);
router.post('/', protect, createRoom);
router.post('/:id/join', protect, joinRoom);
router.post('/:id/leave', protect, leaveRoom);

export default router;

