import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cs_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      // Don't auto-redirect if checking me
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authApi = {
  login: (data: any) => api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
  getNexconnToken: () => api.get('/auth/nexconn-token'),
  searchUsers: (query = '') => api.get(`/auth/users/search?query=${encodeURIComponent(query)}`),
};

// Community endpoints
export const communityApi = {
  getCommunities: (params: any = {}) => api.get('/communities', { params }),
  getCommunityBySlug: (slug: string) => api.get(`/communities/${slug}`),
  createCommunity: (data: any) => api.post('/communities', data),
  joinCommunity: (id: string) => api.post(`/communities/${id}/join`),
  leaveCommunity: (id: string) => api.post(`/communities/${id}/leave`),
  getMembers: (id: string) => api.get(`/communities/${id}/members`),
  getSuggested: () => api.get('/communities/suggested'),
};

// Discussion Rooms endpoints
export const roomApi = {
  getRoomsByCommunity: (communityId: string) => api.get(`/rooms/community/${communityId}`),
  getRoomById: (id: string) => api.get(`/rooms/${id}`),
  createRoom: (data: any) => api.post('/rooms', data),
  joinRoom: (id: string) => api.post(`/rooms/${id}/join`),
  leaveRoom: (id: string) => api.post(`/rooms/${id}/leave`),
};

// AI Assistant endpoints
export const aiApi = {
  getStatus: () => api.get('/ai/status'),
  summarize: (data: { messages: any[]; contextTitle?: string }) => api.post('/ai/summarize', data),
  ask: (data: { question: string; communityContext?: string }) => api.post('/ai/ask', data),
  suggestTopics: (data: { category: string; communityName: string; description?: string }) =>
    api.post('/ai/suggest-topics', data),
  moderate: (data: { content: string }) => api.post('/ai/moderate', data),
  recommendCommunities: () => api.get('/ai/recommend-communities'),
};

// Moderation & Reports endpoints
export const moderationApi = {
  reportMessage: (data: any) => api.post('/moderation/report', data),
  getReports: (status = 'all', page = 1) => api.get(`/moderation/reports?status=${status}&page=${page}`),
  resolveReport: (id: string, data: { status: string; actionNotes?: string }) =>
    api.put(`/moderation/reports/${id}/resolve`, data),
  getStats: () => api.get('/moderation/stats'),
};

// Notifications endpoints
export const notificationApi = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/mark-all-read'),
  clear: () => api.delete('/notifications/clear'),
};

// Health endpoint
export const healthApi = {
  check: () => api.get('/health'),
};

