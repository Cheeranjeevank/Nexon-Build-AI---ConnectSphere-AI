import { geminiService } from '../services/geminiService.js';
import { Community } from '../models/Community.js';

export const summarizeChat = async (req, res) => {
  try {
    const { messages, contextTitle } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ message: 'Messages array is required' });
    }

    const summaryData = await geminiService.summarizeConversation(messages, contextTitle);
    return res.json({ success: true, ...summaryData });
  } catch (error) {
    console.error('AI summarize error:', error);
    return res.status(500).json({ message: error.message });
  }
};

export const askAssistant = async (req, res) => {
  try {
    const { question, communityContext } = req.body;

    if (!question) {
      return res.status(400).json({ message: 'Question is required' });
    }

    const answerData = await geminiService.answerQuestion(question, communityContext);
    return res.json({ success: true, ...answerData });
  } catch (error) {
    console.error('AI ask error:', error);
    return res.status(500).json({ message: error.message });
  }
};

export const suggestTopics = async (req, res) => {
  try {
    const { category, communityName, description } = req.body;

    const topicsData = await geminiService.generateTopics(
      category || 'Technology',
      communityName || 'ConnectSphere Tech Hub',
      description || ''
    );

    return res.json({ success: true, ...topicsData });
  } catch (error) {
    console.error('AI suggest topics error:', error);
    return res.status(500).json({ message: error.message });
  }
};

export const scanModeration = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Content is required for moderation scan' });
    }

    const moderationData = await geminiService.moderateMessage(content);
    return res.json({ success: true, ...moderationData });
  } catch (error) {
    console.error('AI moderation scan error:', error);
    return res.status(500).json({ message: error.message });
  }
};

export const recommendCommunities = async (req, res) => {
  try {
    const userInterests = req.user?.interests || ['Technology', 'AI', 'Startups'];
    const communities = await Community.find().limit(20);

    const recommendationData = await geminiService.recommendCommunities(userInterests, communities);
    return res.json({ success: true, ...recommendationData });
  } catch (error) {
    console.error('AI recommend communities error:', error);
    return res.status(500).json({ message: error.message });
  }
};

export const getAIStatus = async (req, res) => {
  try {
    const configured = geminiService.isConfigured();
    return res.json({
      success: true,
      configured,
      model: configured ? geminiService.modelName : 'Heuristic Synthesizer (Zero-Key Demo Engine)',
      features: [
        'Conversation Summarization',
        'Smart Community Q&A',
        'Topic Generator',
        'AI Content Moderation',
        'Intelligent Community Recommendations',
      ],
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

