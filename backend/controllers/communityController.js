import { Community } from '../models/Community.js';
import { CommunityMember } from '../models/CommunityMember.js';
import { DiscussionRoom } from '../models/DiscussionRoom.js';
import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { nexconnService } from '../services/nexconnService.js';

export const getCommunities = async (req, res) => {
  try {
    const { category, search, sort = 'popular', page = 1, limit = 12 } = req.query;

    const query = {};

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    let sortQuery = { membersCount: -1 };
    if (sort === 'newest') sortQuery = { createdAt: -1 };
    if (sort === 'name') sortQuery = { name: 1 };

    const total = await Community.countDocuments(query);
    const communities = await Community.find(query)
      .sort(sortQuery)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('owner', 'name username avatarUrl');

    return res.json({
      success: true,
      communities,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getCommunityBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const community = await Community.findOne({ slug }).populate('owner', 'name username avatarUrl bio');

    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    // Check if current user is a member
    let isMember = false;
    let userRole = null;
    if (req.user) {
      const membership = await CommunityMember.findOne({
        community: community._id,
        user: req.user._id,
      });
      if (membership) {
        isMember = true;
        userRole = membership.role;
      }
    }

    // Get active discussion rooms for this community
    const discussionRooms = await DiscussionRoom.find({
      community: community._id,
      isActive: true,
    }).populate('createdBy', 'name username avatarUrl');

    // Get recent members
    const members = await CommunityMember.find({ community: community._id })
      .sort({ joinedAt: -1 })
      .limit(8)
      .populate('user', 'name username avatarUrl bio isOnline');

    return res.json({
      success: true,
      community,
      isMember,
      userRole,
      discussionRooms,
      members,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const createCommunity = async (req, res) => {
  try {
    const { name, description, category, avatarUrl, bannerUrl, rules, tags, isPrivate } = req.body;

    if (!name || !description || !category) {
      return res.status(400).json({ message: 'Name, description, and category are required' });
    }

    // Generate slug
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const slug = `${baseSlug}-${randomSuffix}`;

    // Generate unique Nexconn Group ID
    const nexconnGroupId = `grp_${slug.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40)}_${Date.now()}`;

    // Register group channel on Nexconn server
    await nexconnService.createGroupChannel(
      nexconnGroupId,
      name,
      req.user._id,
      [req.user._id],
      {
        introduction: description.slice(0, 500),
        portraitUrl: avatarUrl || '',
      }
    );

    const community = new Community({
      name,
      slug,
      description,
      category,
      avatarUrl:
        avatarUrl ||
        `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80`,
      bannerUrl:
        bannerUrl ||
        `https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80`,
      owner: req.user._id,
      membersCount: 1,
      isPrivate: Boolean(isPrivate),
      nexconnGroupId,
      rules: rules && rules.length > 0 ? rules : undefined,
      tags: tags || [],
    });

    await community.save();

    // Add creator as member with 'owner' role
    await CommunityMember.create({
      community: community._id,
      user: req.user._id,
      role: 'owner',
    });

    // Add to user's joined communities
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { joinedCommunities: community._id },
    });

    // Auto-create a default general discussion room for this community
    const defaultOpenChannelId = `room_${community.slug}_general`;
    await nexconnService.createOpenChannel(defaultOpenChannelId);
    await DiscussionRoom.create({
      community: community._id,
      name: 'General Discussion',
      topic: 'Open floor for introductions, updates, and general conversations',
      description: 'The main gathering room for this community.',
      openChannelId: defaultOpenChannelId,
      createdBy: req.user._id,
      participantCount: 1,
      isActive: true,
      tags: ['General', 'Introductions'],
    });

    return res.status(201).json({
      success: true,
      community,
    });
  } catch (error) {
    console.error('Create community error:', error);
    return res.status(500).json({ message: error.message });
  }
};

export const joinCommunity = async (req, res) => {
  try {
    const { id } = req.params;
    const community = await Community.findById(id);

    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    const existingMember = await CommunityMember.findOne({
      community: community._id,
      user: req.user._id,
    });

    if (existingMember) {
      return res.status(400).json({ message: 'Already a member of this community' });
    }

    await CommunityMember.create({
      community: community._id,
      user: req.user._id,
      role: 'member',
    });

    community.membersCount += 1;
    await community.save();

    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { joinedCommunities: community._id },
    });

    // Create notification for community owner
    if (String(community.owner) !== String(req.user._id)) {
      await Notification.create({
        recipient: community.owner,
        sender: req.user._id,
        type: 'new_member',
        title: 'New Community Member',
        content: `${req.user.name} joined your community "${community.name}"!`,
        link: `/community/${community.slug}`,
      });
    }

    return res.json({
      success: true,
      message: 'Joined community successfully',
      membersCount: community.membersCount,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const leaveCommunity = async (req, res) => {
  try {
    const { id } = req.params;
    const community = await Community.findById(id);

    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    if (String(community.owner) === String(req.user._id)) {
      return res.status(400).json({ message: 'Community owner cannot leave without transferring ownership' });
    }

    const deleted = await CommunityMember.findOneAndDelete({
      community: community._id,
      user: req.user._id,
    });

    if (deleted) {
      community.membersCount = Math.max(1, community.membersCount - 1);
      await community.save();

      await User.findByIdAndUpdate(req.user._id, {
        $pull: { joinedCommunities: community._id },
      });
    }

    return res.json({
      success: true,
      message: 'Left community successfully',
      membersCount: community.membersCount,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getCommunityMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const members = await CommunityMember.find({ community: id })
      .populate('user', 'name username avatarUrl bio isOnline lastSeen')
      .sort({ joinedAt: 1 });

    return res.json({ success: true, members });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getSuggestedCommunities = async (req, res) => {
  try {
    const joinedIds = req.user?.joinedCommunities || [];
    const suggested = await Community.find({ _id: { $nin: joinedIds } })
      .sort({ membersCount: -1, featured: -1 })
      .limit(6)
      .populate('owner', 'name username avatarUrl');

    return res.json({ success: true, communities: suggested });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

