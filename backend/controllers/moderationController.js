import { Report } from '../models/Report.js';
import { User } from '../models/User.js';
import { Community } from '../models/Community.js';
import { DiscussionRoom } from '../models/DiscussionRoom.js';
import { geminiService } from '../services/geminiService.js';
import { nexconnService } from '../services/nexconnService.js';

export const reportMessage = async (req, res) => {
  try {
    const { messageId, channelId, channelType, content, reason, reportedUserId } = req.body;

    if (!reason) {
      return res.status(400).json({ message: 'A reason for the report is required' });
    }

    // Run AI scan on the message content
    let aiAnalysis = {
      toxicityScore: 0,
      flaggedCategories: [],
      recommendation: 'allow',
      isAppropriate: true,
    };

    if (content) {
      const scanResult = await geminiService.moderateMessage(content);
      aiAnalysis = {
        toxicityScore: scanResult.toxicityScore || 0,
        flaggedCategories: scanResult.flaggedCategories || [],
        recommendation: scanResult.recommendation || 'allow',
        isAppropriate: scanResult.isAppropriate ?? true,
      };
    }

    const report = new Report({
      reporter: req.user._id,
      reportedUser: reportedUserId || null,
      messageId: messageId || '',
      channelId: channelId || '',
      channelType: channelType || 'group',
      content: content || '',
      reason,
      aiAnalysis,
      status: 'pending',
    });

    await report.save();

    return res.status(201).json({
      success: true,
      message: 'Report submitted successfully and queued for moderation review.',
      reportId: report._id,
      aiFlagged: !aiAnalysis.isAppropriate,
    });
  } catch (error) {
    console.error('Report message error:', error);
    return res.status(500).json({ message: error.message });
  }
};

export const getReports = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const total = await Report.countDocuments(query);
    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('reporter', 'name username avatarUrl')
      .populate('reportedUser', 'name username avatarUrl email role')
      .populate('reviewedBy', 'name username');

    return res.json({
      success: true,
      reports,
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

export const resolveReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, actionNotes } = req.body;

    if (!['reviewed', 'action_taken', 'dismissed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    report.status = status;
    report.reviewedBy = req.user._id;
    if (actionNotes) report.actionNotes = actionNotes;

    await report.save();

    return res.json({
      success: true,
      message: `Report marked as ${status}`,
      report,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getModerationStats = async (req, res) => {
  try {
    const [
      totalReports,
      pendingReports,
      actionTakenReports,
      totalUsers,
      totalCommunities,
      totalRooms,
    ] = await Promise.all([
      Report.countDocuments(),
      Report.countDocuments({ status: 'pending' }),
      Report.countDocuments({ status: 'action_taken' }),
      User.countDocuments(),
      Community.countDocuments(),
      DiscussionRoom.countDocuments(),
    ]);

    const nexconnStatus = nexconnService.getStatus();
    const aiConfigured = geminiService.isConfigured();

    return res.json({
      success: true,
      stats: {
        totalReports,
        pendingReports,
        actionTakenReports,
        totalUsers,
        totalCommunities,
        totalRooms,
        nexconnStatus,
        aiConfigured,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

