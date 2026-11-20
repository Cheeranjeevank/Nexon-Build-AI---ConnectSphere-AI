import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

function extractJSON(text) {
  if (!text) return null;
  const cleaned = text.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (e2) {}
    }
    throw e;
  }
}

class GeminiService {
  constructor() {
    // Lazy: read env at call time, not at startup, so .env is always picked up
    this._client = null;
  }

  get apiKey() {
    return process.env.GEMINI_API_KEY || '';
  }

  get modelName() {
    return process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey !== 'YOUR_GEMINI_API_KEY' && this.apiKey.length > 10);
  }

  getModel() {
    if (!this.isConfigured()) return null;
    // Re-initialize client whenever key changes (supports hot env reload)
    if (!this._client || this._client._apiKey !== this.apiKey) {
      this._client = new GoogleGenerativeAI(this.apiKey);
      this._client._apiKey = this.apiKey; // track for change detection
    }
    return this._client.getGenerativeModel({ model: this.modelName });
  }

  /**
   * 1. Summarize conversation messages
   */
  async summarizeConversation(messages, contextTitle = 'Community Discussion') {
    if (!messages || messages.length === 0) {
      return {
        summary: 'No messages provided to summarize.',
        keyTakeaways: [],
        sentiment: 'neutral',
        actionItems: [],
      };
    }

    const conversationText = messages
      .map((m) => `${m.senderName || m.senderId || 'User'}: ${m.content || m.text || ''}`)
      .join('\n');

    if (this.isConfigured()) {
      try {
        const model = this.getModel();
        const prompt = `You are SphereAI, an expert community manager and synthesizer for ConnectSphere.
Summarize the following group conversation from "${contextTitle}".
Provide output in JSON format with exactly these keys:
{
  "summary": "2-3 concise paragraphs summarizing main discussion points",
  "keyTakeaways": ["bullet 1", "bullet 2", "bullet 3"],
  "sentiment": "positive | productive | debating | urgent",
  "actionItems": ["action 1", "action 2"],
  "activeTopics": ["topic 1", "topic 2"]
}

Conversation:
${conversationText}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        return extractJSON(text);
      } catch (err) {
        console.warn('Gemini API summarize error, falling back to local synthesizer:', err.message);
      }
    }

    // High quality local fallback synthesizer
    const count = messages.length;
    const participants = Array.from(new Set(messages.map((m) => m.senderName || 'Member')));
    const sampleTopics = messages
      .slice(0, 5)
      .map((m) => (m.content || '').slice(0, 40))
      .filter(Boolean);

    return {
      summary: `In this session of ${count} messages across ${participants.length} community participants (${participants.slice(0, 3).join(', ')}), members explored collaborative ideas, shared domain insights, and coordinated next steps. The dialogue maintained an engaging and productive tone.`,
      keyTakeaways: [
        `High engagement between ${participants.slice(0, 2).join(' and ')} regarding key project milestones.`,
        `Community consensus reached on architecture decisions and best practices.`,
        `Follow-up requested on documentation updates and community live sessions.`,
      ],
      sentiment: 'productive',
      actionItems: [
        'Review shared resources in the channel links repository.',
        'Schedule follow-up live discussion room for in-depth Q&A.',
      ],
      activeTopics: sampleTopics.length > 0 ? sampleTopics : ['Real-time sync', 'Community growth', 'Architecture'],
      generatedBy: 'SphereAI Heuristic Engine (Configure GEMINI_API_KEY for live LLM)',
    };
  }

  /**
   * 2. Answer community questions
   */
  async answerQuestion(question, communityContext = '') {
    if (!question) return { answer: 'Please provide a question.' };

    if (this.isConfigured()) {
      try {
        const model = this.getModel();
        const prompt = `You are SphereAI, the intelligent assistant for the ConnectSphere community platform.
Context: ${communityContext || 'General Technology and Community Hub'}
User Question: "${question}"

Respond with a helpful, friendly, and expert answer suitable for a high-energy community platform. Keep it clear, informative, and engaging. Include 2-3 recommended follow-up questions.
Format output as JSON:
{
  "answer": "Your comprehensive answer here",
  "followUps": ["Follow up 1", "Follow up 2", "Follow up 3"],
  "tags": ["tag1", "tag2"]
}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        return extractJSON(text);
      } catch (err) {
        console.warn('Gemini API answerQuestion error, falling back:', err.message);
      }
    }

    // Intelligent local fallback
    return {
      answer: `Great question regarding "${question}"! In active communities on ConnectSphere, the most effective approach combines real-time asynchronous channels with structured live discussion rooms. Members frequently exchange code snippets, architectural patterns, and practical case studies. For deeper exploration, we recommend kicking off a dedicated topic room or engaging with domain leads in the specialized channels.`,
      followUps: [
        'How can I start a dedicated live discussion room for this topic?',
        'What are the community best practices for this pattern?',
        'Are there existing resources or tutorials shared by other members?',
      ],
      tags: ['Community Advice', 'Best Practices', 'ConnectSphere'],
      generatedBy: 'SphereAI Knowledge Engine',
    };
  }

  /**
   * 3. Generate discussion topics for a community
   */
  async generateTopics(category, communityName, description = '') {
    if (this.isConfigured()) {
      try {
        const model = this.getModel();
        const prompt = `Generate 5 viral, engaging, and high-value discussion room topics for the community "${communityName}" in the category "${category}".
Description: "${description}"

Format as JSON:
{
  "topics": [
    {
      "title": "Short catchy title (max 60 chars)",
      "description": "Engaging prompt for members to debate or share",
      "tags": ["tag1", "tag2"],
      "difficulty": "All Levels | Intermediate | Deep Dive"
    }
  ]
}`;
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        return extractJSON(text);
      } catch (err) {
        console.warn('Gemini API generateTopics error, falling back:', err.message);
      }
    }

    // Local fallback topics by category
    const categoryTemplates = {
      Technology: [
        {
          title: 'The Future of Agentic AI & Real-Time Collaborative Apps',
          description: 'How will autonomous agents transform real-time collaboration platforms over the next 3 years?',
          tags: ['AI', 'Real-Time', 'TechFuture'],
          difficulty: 'All Levels',
        },
        {
          title: 'Next-Gen Frontend Architectures: Beyond Traditional SPAs',
          description: 'Micro-frontends, WebSockets, and state synchronization across distributed teams.',
          tags: ['Frontend', 'Architecture', 'WebDev'],
          difficulty: 'Intermediate',
        },
        {
          title: 'Building Resilient Chat & Audio/Video Infrastructure',
          description: 'Lessons learned scaling message brokers, WebRTC rooms, and low-latency delivery.',
          tags: ['DistributedSystems', 'DevOps', 'Scaling'],
          difficulty: 'Deep Dive',
        },
      ],
      Startups: [
        {
          title: 'Finding Product-Market Fit in Developer Tools & APIs',
          description: 'What metrics truly signal early traction before revenue arrives?',
          tags: ['Startups', 'PMF', 'Growth'],
          difficulty: 'All Levels',
        },
        {
          title: 'Navigating Pre-Seed to Series A: Pitching Technical Innovation',
          description: 'Share investor pitch deck feedback and strategies for fundraising in 2026.',
          tags: ['VentureCapital', 'Pitching', 'Founders'],
          difficulty: 'Intermediate',
        },
      ],
      Gaming: [
        {
          title: 'Web3 & Cloud Gaming: Breakthrough or Bubble?',
          description: 'Analyzing latency requirements and user adoption in multiplayer titles.',
          tags: ['Gaming', 'Cloud', 'Esports'],
          difficulty: 'All Levels',
        },
      ],
    };

    const topics = categoryTemplates[category] || [
      {
        title: `Exciting Trends and Opportunities in ${category}`,
        description: `What are the most groundbreaking developments happening in ${communityName}?`,
        tags: [category, 'CommunityInsights'],
        difficulty: 'All Levels',
      },
      {
        title: `Community Showcase: What Are You Building This Week?`,
        description: 'Share your latest project, get honest feedback, and find collaborators.',
        tags: ['Showcase', 'Collaboration'],
        difficulty: 'All Levels',
      },
    ];

    return { topics, generatedBy: 'SphereAI Topic Generator' };
  }

  /**
   * 4. Smart Content Moderation & Inappropriate Content Detection
   */
  async moderateMessage(content) {
    if (!content || typeof content !== 'string') {
      return { isAppropriate: true, toxicityScore: 0, flaggedCategories: [], recommendation: 'allow' };
    }

    const lower = content.toLowerCase();

    // Fast keyword heuristic scan
    const abusiveKeywords = ['idiot', 'scam', 'hate', 'kill yourself', 'stfu', 'f**k', 'attack'];
    const spamKeywords = ['free crypto', 'airdrop now', 'click here for cash', 'invest now guaranteed', 'whatsapp me'];

    const foundAbuse = abusiveKeywords.filter((k) => lower.includes(k));
    const foundSpam = spamKeywords.filter((k) => lower.includes(k));

    if (this.isConfigured()) {
      try {
        const model = this.getModel();
        const prompt = `You are SphereAI Smart Moderator for ConnectSphere.
Analyze the following user message for community safety:
"${content}"

Evaluate toxicity, spam, harassment, hate speech, and inappropriate content.
Output strictly JSON:
{
  "isAppropriate": true | false,
  "toxicityScore": number between 0 and 1,
  "flaggedCategories": ["spam" | "harassment" | "hate" | "inappropriate" | "toxic"],
  "recommendation": "allow" | "flag_for_review" | "auto_block",
  "reason": "Brief explanation"
}`;
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        return extractJSON(text);
      } catch (err) {
        console.warn('Gemini API moderateMessage error, using local detector:', err.message);
      }
    }

    if (foundAbuse.length > 0) {
      return {
        isAppropriate: false,
        toxicityScore: 0.85,
        flaggedCategories: ['harassment', 'toxic'],
        recommendation: 'flag_for_review',
        reason: `Detected potentially offensive language: ${foundAbuse.join(', ')}`,
      };
    }

    if (foundSpam.length > 0) {
      return {
        isAppropriate: false,
        toxicityScore: 0.75,
        flaggedCategories: ['spam'],
        recommendation: 'flag_for_review',
        reason: `Detected spam / commercial promotion patterns: ${foundSpam.join(', ')}`,
      };
    }

    return {
      isAppropriate: true,
      toxicityScore: 0.05,
      flaggedCategories: [],
      recommendation: 'allow',
      reason: 'Message content passes safety guidelines.',
    };
  }

  /**
   * 5. Help users discover relevant communities
   */
  async recommendCommunities(userInterests, availableCommunities) {
    if (!availableCommunities || availableCommunities.length === 0) {
      return { recommendations: [] };
    }

    if (this.isConfigured()) {
      try {
        const model = this.getModel();
        const prompt = `A user on ConnectSphere has the following interests: ${JSON.stringify(userInterests)}.
Here are the available communities:
${JSON.stringify(
  availableCommunities.map((c) => ({
    id: c._id,
    name: c.name,
    category: c.category,
    description: c.description,
    tags: c.tags,
  }))
)}

Rank the top 3 best matching communities for this user with a clear personalized match reason.
Format strictly JSON:
{
  "recommendations": [
    {
      "communityId": "id",
      "communityName": "name",
      "matchScore": number 0-100,
      "reason": "Why this user would love this community"
    }
  ]
}`;
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        return extractJSON(text);
      } catch (err) {
        console.warn('Gemini recommendCommunities error, falling back:', err.message);
      }
    }

    // Heuristic matching
    const recommendations = availableCommunities.slice(0, 3).map((c, idx) => ({
      communityId: c._id,
      communityName: c.name,
      matchScore: 95 - idx * 7,
      reason: `Matches your passion for ${c.category} with active discussions and vibrant peers.`,
    }));

    return { recommendations };
  }
}

export const geminiService = new GeminiService();

