import crypto from 'crypto';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class NexconnService {
  get appKey() {
    return process.env.NEXCONN_APP_KEY || '';
  }

  get appSecret() {
    return process.env.NEXCONN_APP_SECRET || '';
  }

  get baseUrl() {
    return process.env.NEXCONN_API_BASE_URL || 'https://api.sg-light-api.com';
  }

  isConfigured() {
    return Boolean(
      this.appKey &&
      this.appSecret &&
      this.appKey !== 'YOUR_NEXCONN_APP_KEY' &&
      this.appSecret !== 'YOUR_NEXCONN_APP_SECRET'
    );
  }

  getAuthHeaders() {
    const nonce = Math.floor(Math.random() * 1000000).toString();
    const timestamp = Date.now().toString();
    const signature = crypto
      .createHash('sha1')
      .update(this.appSecret + nonce + timestamp)
      .digest('hex');

    const requestId = crypto.randomUUID().replace(/-/g, '');

    return {
      'App-Key': this.appKey,
      'Nonce': nonce,
      'Timestamp': timestamp,
      'Signature': signature,
      'X-Request-ID': requestId,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Issue access token for a user to connect to Nexconn Chat SDK
   * Endpoint: POST /v4/auth/access-token/issue
   */
  async issueAccessToken(userId, name, avatarUrl = '') {
    if (!this.isConfigured()) {
      console.warn(
        '⚠️ Nexconn credentials not configured. Generating developer test token. Set NEXCONN_APP_KEY and NEXCONN_APP_SECRET in backend/.env for live production connection.'
      );
      // Generate a reproducible developer token format matching Nexconn format for offline testing
      const mockToken = `nx_dev_${userId}_${crypto.randomBytes(16).toString('hex')}@${this.baseUrl.replace('https://', '')}`;
      return {
        isMock: true,
        userId: String(userId),
        accessToken: mockToken,
      };
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/v4/auth/access-token/issue`,
        {
          userId: String(userId),
          name: name || `User_${userId}`,
          avatarUrl: avatarUrl || '',
        },
        {
          headers: this.getAuthHeaders(),
          timeout: 8000,
        }
      );

      if (response.data && response.data.code === 0 && response.data.result) {
        return {
          isMock: false,
          userId: response.data.result.userId,
          accessToken: response.data.result.accessToken,
        };
      }

      console.error('Nexconn token issuance returned error:', response.data);
      throw new Error(response.data?.msg || 'Failed to issue Nexconn token');
    } catch (error) {
      console.error('Error contacting Nexconn Server API:', error.response?.data || error.message);
      // Fallback to dev token so client testing can proceed with diagnostic notification
      const mockToken = `nx_fallback_${userId}_${crypto.randomBytes(16).toString('hex')}`;
      return {
        isMock: true,
        error: error.message,
        userId: String(userId),
        accessToken: mockToken,
      };
    }
  }

  /**
   * Create a group channel on Nexconn server
   * Endpoint: POST /v4/group-channel/create
   */
  async createGroupChannel(channelId, name, ownerUserId, inviteeUserIds = [], profile = {}) {
    if (!this.isConfigured()) {
      return { isMock: true, channelId, code: 0 };
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/v4/group-channel/create`,
        {
          channelId: String(channelId),
          name: name.slice(0, 64),
          owner: String(ownerUserId),
          userIds: inviteeUserIds.map(String).slice(0, 30),
          groupProfile: {
            introduction: profile.introduction || '',
            portraitUrl: profile.portraitUrl || '',
          },
          permissions: {
            joinPerm: 1, // 1: No approval needed to join group
          },
        },
        {
          headers: this.getAuthHeaders(),
          timeout: 8000,
        }
      );

      return { isMock: false, ...response.data };
    } catch (error) {
      const errData = error.response?.data;
      // 25409 = channel already exists; still treat as success
      if (errData?.code === 25409) {
        return { isMock: false, code: 0, existed: true, channelId };
      }
      console.warn('Nexconn createGroupChannel error:', errData || error.message);
      return { isMock: true, error: error.message, channelId };
    }
  }

  /**
   * Invite users to an existing group channel
   * Endpoint: POST /v4/group-channel/invite
   */
  async inviteToGroupChannel(channelId, userIds = []) {
    if (!this.isConfigured() || userIds.length === 0) {
      return { isMock: true, code: 0 };
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/v4/group-channel/invite`,
        {
          channelId: String(channelId),
          userIds: userIds.map(String).slice(0, 100),
        },
        {
          headers: this.getAuthHeaders(),
          timeout: 8000,
        }
      );
      return { isMock: false, ...response.data };
    } catch (error) {
      console.warn('Nexconn inviteToGroupChannel error:', error.response?.data || error.message);
      return { isMock: true, error: error.message };
    }
  }

  /**
   * Create an open channel (Live Discussion Room) on Nexconn server
   * Endpoint: POST /v4/open-channel/create
   */
  async createOpenChannel(channelId, ttlMinutes = 1440) {
    if (!this.isConfigured()) {
      return { isMock: true, channelId, code: 0 };
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/v4/open-channel/create`,
        {
          channelId: String(channelId),
          destroyType: 0, // 0: Destroy on inactivity
          ttlMinutes: Math.max(60, ttlMinutes),
        },
        {
          headers: this.getAuthHeaders(),
          timeout: 8000,
        }
      );

      return { isMock: false, ...response.data };
    } catch (error) {
      console.warn('Nexconn createOpenChannel error:', error.response?.data || error.message);
      return { isMock: true, error: error.message, channelId };
    }
  }

  /**
   * Get server status and configuration summary (safe to expose publicly)
   */
  getStatus() {
    return {
      configured: this.isConfigured(),
      appKey: this.appKey ? `${this.appKey.slice(0, 4)}...${this.appKey.slice(-4)}` : 'Not set',
      baseUrl: this.baseUrl,
      region: this.baseUrl.includes('us-') ? 'North America' : 'Singapore (Global)',
    };
  }
}

export const nexconnService = new NexconnService();

