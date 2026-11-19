import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { nexconnService } from '../services/nexconnService.js';

const generateJWT = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'connectsphere-dev-secret-key-2026', {
    expiresIn: '30d',
  });
};

export const register = async (req, res) => {
  try {
    const { username, email, password, name, avatarUrl, bio, interests } = req.body;

    if (!username || !email || !password || !name) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const userExists = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
    });

    if (userExists) {
      return res.status(400).json({ message: 'User with that email or username already exists' });
    }

    // Create user
    const user = new User({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      name,
      avatarUrl:
        avatarUrl ||
        `https://api.dicebear.com/7.x/bottts/svg?seed=${username}&backgroundColor=0f172a`,
      bio: bio || 'Excited to connect on ConnectSphere!',
      interests: interests || ['Technology', 'AI', 'Startups'],
      role: 'user',
    });

    // Obtain Nexconn token for this user
    try {
      const nexconnRes = await nexconnService.issueAccessToken(user._id, user.name, user.avatarUrl);
      user.nexconnToken = nexconnRes.accessToken;
    } catch (err) {
      console.warn('Could not auto-fetch Nexconn token at register:', err.message);
    }

    await user.save();

    const jwtToken = generateJWT(user._id);

    return res.status(201).json({
      success: true,
      token: jwtToken,
      user: {
        _id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        role: user.role,
        interests: user.interests,
        nexconnToken: user.nexconnToken,
        joinedCommunities: user.joinedCommunities,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: error.message || 'Server error during registration' });
  }
};

export const login = async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res.status(400).json({ message: 'Please provide email/username and password' });
    }

    const query = emailOrUsername.includes('@')
      ? { email: emailOrUsername.toLowerCase() }
      : { username: emailOrUsername.toLowerCase() };

    const user = await User.findOne(query).populate('joinedCommunities', 'name slug category avatarUrl membersCount');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Refresh Nexconn token if missing
    if (!user.nexconnToken) {
      try {
        const nexconnRes = await nexconnService.issueAccessToken(user._id, user.name, user.avatarUrl);
        user.nexconnToken = nexconnRes.accessToken;
        await user.save();
      } catch (err) {
        console.warn('Could not refresh Nexconn token on login:', err.message);
      }
    }

    const jwtToken = generateJWT(user._id);

    return res.json({
      success: true,
      token: jwtToken,
      user: {
        _id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        role: user.role,
        interests: user.interests,
        nexconnToken: user.nexconnToken,
        joinedCommunities: user.joinedCommunities,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: error.message || 'Server error during login' });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('joinedCommunities', 'name slug category avatarUrl bannerUrl membersCount nexconnGroupId');

    return res.json({
      success: true,
      user,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, bio, avatarUrl, interests } = req.body;
    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (avatarUrl) user.avatarUrl = avatarUrl;
    if (interests && Array.isArray(interests)) user.interests = interests;

    await user.save();

    return res.json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        role: user.role,
        interests: user.interests,
        nexconnToken: user.nexconnToken,
        joinedCommunities: user.joinedCommunities,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getNexconnToken = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const nexconnRes = await nexconnService.issueAccessToken(user._id, user.name, user.avatarUrl);
    user.nexconnToken = nexconnRes.accessToken;
    await user.save();

    return res.json({
      success: true,
      userId: String(user._id),
      token: nexconnRes.accessToken,
      isMock: nexconnRes.isMock || false,
      appKey: process.env.NEXCONN_APP_KEY || 'YOUR_NEXCONN_APP_KEY',
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const filter = { _id: { $ne: req.user._id } };

    if (query) {
      filter.$or = [
        { username: { $regex: query, $options: 'i' } },
        { name: { $regex: query, $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .select('_id username name avatarUrl bio isOnline lastSeen')
      .limit(20);

    return res.json({ success: true, users });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

