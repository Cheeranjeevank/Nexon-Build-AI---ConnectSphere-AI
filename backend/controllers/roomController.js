import { DiscussionRoom } from '../models/DiscussionRoom.js';
import { Community } from '../models/Community.js';
import { CommunityMember } from '../models/CommunityMember.js';
import { Notification } from '../models/Notification.js';
import { nexconnService } from '../services/nexconnService.js';

export const getRoomsByCommunity = async (req, res) => {
  try {
    const { communityId } = req.params;
    const rooms = await DiscussionRoom.find({ community: communityId, isActive: true })
      .populate('createdBy', 'name username avatarUrl')
      .sort({ participantCount: -1, createdAt: -1 });

    return res.json({ success: true, rooms });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getRoomById = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await DiscussionRoom.findById(id)
      .populate('community', 'name slug category avatarUrl')
      .populate('createdBy', 'name username avatarUrl bio');

    if (!room) {
      return res.status(404).json({ message: 'Discussion room not found' });
    }

    return res.json({ success: true, room });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const createRoom = async (req, res) => {
  try {
    const { communityId, name, topic, description, tags } = req.body;

    if (!communityId || !name || !topic) {
      return res.status(400).json({ message: 'Community ID, name, and topic are required' });
    }

    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    // Verify user is a member of this community
    const isMember = await CommunityMember.findOne({
      community: communityId,
      user: req.user._id,
    });
    if (!isMember) {
      return res.status(403).json({ message: 'You must join this community before creating a discussion room' });
    }

    // Generate unique open channel ID for Nexconn Chat SDK OpenChannel
    const cleanName = name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().slice(0, 30);
    const openChannelId = `room_${community.slug}_${cleanName}_${Date.now()}`;

    // Register Open Channel on Nexconn server
    await nexconnService.createOpenChannel(openChannelId, 1440);

    const room = new DiscussionRoom({
      community: community._id,
      name,
      topic,
      description: description || '',
      openChannelId,
      createdBy: req.user._id,
      participantCount: 1,
      isActive: true,
      tags: tags || [],
    });

    await room.save();

    // Notify community owner if not the creator
    if (String(community.owner) !== String(req.user._id)) {
      await Notification.create({
        recipient: community.owner,
        sender: req.user._id,
        type: 'discussion_activity',
        title: 'New Discussion Room Live',
        content: `${req.user.name} created room "${name}" in "${community.name}"!`,
        link: `/community/${community.slug}?room=${room._id}`,
      });
    }

    return res.status(201).json({
      success: true,
      room,
    });
  } catch (error) {
    console.error('Create room error:', error);
    return res.status(500).json({ message: error.message });
  }
};

export const joinRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await DiscussionRoom.findByIdAndUpdate(
      id,
      { $inc: { participantCount: 1 } },
      { new: true }
    );

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    return res.json({ success: true, participantCount: room.participantCount, room });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const leaveRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await DiscussionRoom.findById(id);

    if (room) {
      room.participantCount = Math.max(0, room.participantCount - 1);
      await room.save();
    }

    return res.json({ success: true, participantCount: room?.participantCount || 0, room });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

