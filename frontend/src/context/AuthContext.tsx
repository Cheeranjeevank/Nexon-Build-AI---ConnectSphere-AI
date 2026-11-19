import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';
import { nexconnChat } from '../services/nexconnChat';

export interface UserProfile {
  _id: string;
  username: string;
  name: string;
  email: string;
  avatarUrl: string;
  bio: string;
  role: 'user' | 'moderator' | 'admin';
  interests: string[];
  nexconnToken?: string;
  joinedCommunities: any[];
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  nexconnStatus: string;
  login: (emailOrUsername: string, password: string) => Promise<boolean>;
  register: (userData: any) => Promise<boolean>;
  logout: () => void;
  updateUser: (data: Partial<UserProfile>) => void;
  refreshUser: () => Promise<void>;
  connectChat: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('cs_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [nexconnStatus, setNexconnStatus] = useState<string>('Disconnected');

  // Monitor Nexconn chat status
  useEffect(() => {
    const unsub = nexconnChat.onStatusChange((_status, statusText) => {
      setNexconnStatus(statusText);
    });
    return unsub;
  }, []);

  // Check current session on load
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('cs_token');
      if (storedToken) {
        try {
          const res = await authApi.getMe();
          if (res.data?.success && res.data.user) {
            setUser(res.data.user);
            // Connect to Nexconn SDK
            if (res.data.user.nexconnToken) {
              nexconnChat.connect(res.data.user._id, res.data.user.nexconnToken);
            }
          } else {
            localStorage.removeItem('cs_token');
            setToken(null);
          }
        } catch (err) {
          console.warn('Session verification failed:', err);
          localStorage.removeItem('cs_token');
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const connectChat = async () => {
    if (!user) return;
    try {
      let chatToken = user.nexconnToken;
      if (!chatToken) {
        const tokenRes = await authApi.getNexconnToken();
        chatToken = tokenRes.data.token;
        setUser((prev) => (prev ? { ...prev, nexconnToken: chatToken } : null));
      }
      if (chatToken) {
        await nexconnChat.connect(user._id, chatToken);
      }
    } catch (err) {
      console.warn('Connect chat failed:', err);
    }
  };

  const login = async (emailOrUsername: string, password: string): Promise<boolean> => {
    try {
      const res = await authApi.login({ emailOrUsername, password });
      if (res.data?.success) {
        const newToken = res.data.token;
        const newUser = res.data.user;
        localStorage.setItem('cs_token', newToken);
        setToken(newToken);
        setUser(newUser);

        if (newUser.nexconnToken) {
          nexconnChat.connect(newUser._id, newUser.nexconnToken);
        }
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Login error:', error.response?.data?.message || error.message);
      throw error;
    }
  };

  const register = async (userData: any): Promise<boolean> => {
    try {
      const res = await authApi.register(userData);
      if (res.data?.success) {
        const newToken = res.data.token;
        const newUser = res.data.user;
        localStorage.setItem('cs_token', newToken);
        setToken(newToken);
        setUser(newUser);

        if (newUser.nexconnToken) {
          nexconnChat.connect(newUser._id, newUser.nexconnToken);
        }
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Registration error:', error.response?.data?.message || error.message);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('cs_token');
    setToken(null);
    setUser(null);
    nexconnChat.disconnect();
  };

  const updateUser = (data: Partial<UserProfile>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : null));
  };

  const refreshUser = async () => {
    try {
      const res = await authApi.getMe();
      if (res.data?.success && res.data.user) {
        setUser(res.data.user);
      }
    } catch (e) {
      console.warn('Failed to refresh user:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        isLoading,
        nexconnStatus,
        login,
        register,
        logout,
        updateUser,
        refreshUser,
        connectChat,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

