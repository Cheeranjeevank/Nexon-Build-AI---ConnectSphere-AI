import express from 'express';
import {
  getCommunities,
  getCommunityBySlug,
  createCommunity,
  joinCommunity,
  leaveCommunity,
  getCommunityMembers,
  getSuggestedCommunities,
} from '../controllers/communityController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getCommunities);
router.get('/suggested', protect, getSuggestedCommunities);
router.get('/:slug', (req, res, next) => {
  // Optional auth to attach user if logged in
  if (req.headers.authorization) {
    return protect(req, res, () => getCommunityBySlug(req, res, next));
  }
  return getCommunityBySlug(req, res, next);
});
router.post('/', protect, createCommunity);
router.post('/:id/join', protect, joinCommunity);
router.post('/:id/leave', protect, leaveCommunity);
router.get('/:id/members', getCommunityMembers);

export default router;

