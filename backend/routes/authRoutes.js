import express from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  getNexconnToken,
  searchUsers,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.get('/nexconn-token', protect, getNexconnToken);
router.get('/users/search', protect, searchUsers);

export default router;

