import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { nexconnChat } from '../services/nexconnChat';
import {
  User,
  Mail,
  Shield,
  Key,
  Wifi,
  Sparkles,
  RefreshCw,
  Save,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const ProfilePage: React.FC = () => {
  const { user, nexconnStatus, updateUser, connectChat } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [interestsInput, setInterestsInput] = useState((user?.interests || []).join(', '));
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshingToken, setIsRefreshingToken] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sdkStatus = nexconnChat.getSDKStatus();

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    const interests = interestsInput
      .split(',')
      .map((i) => i.trim())
      .filter(Boolean);

    try {
      const res = await authApi.updateProfile({
        name,
        bio,
        avatarUrl,
        interests,
      });

      if (res.data?.success) {
        updateUser(res.data.user);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefreshToken = async () => {
    setIsRefreshingToken(true);
    try {
      const res = await authApi.getNexconnToken();
      if (res.data?.success && res.data.token) {
        updateUser({ nexconnToken: res.data.token });
        await connectChat();
      }
    } catch (e) {
      console.warn('Token refresh error:', e);
    } finally {
      setIsRefreshingToken(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Profile Overview Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <img
            src={user?.avatarUrl}
            alt={user?.name}
            className="w-24 h-24 rounded-3xl object-cover ring-4 ring-brand-indigo/30 shadow-xl"
          />
          <div className="text-center sm:text-left flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <h1 className="text-2xl font-extrabold text-white">{user?.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-indigo/20 text-brand-indigo border border-brand-indigo/30 uppercase tracking-wider">
                {user?.role}
              </span>
            </div>
            <p className="text-xs text-dark-400 font-mono mb-2">@{user?.username} • {user?.email}</p>
            <p className="text-xs sm:text-sm text-dark-300 max-w-xl">{user?.bio}</p>

            <div className="flex flex-wrap gap-1.5 mt-3 justify-center sm:justify-start">
              {(user?.interests || []).map((interest) => (
                <span
                  key={interest}
                  className="px-2.5 py-1 rounded-lg text-xs bg-dark-900 border border-white/5 text-dark-300"
                >
                  #{interest}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Edit Profile Form */}
        <div className="lg:col-span-2 glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-brand-blue" />
            <span>Edit Profile Information</span>
          </h2>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-dark-300 mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full py-2.5 px-3.5 rounded-xl glass-input text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-dark-300 mb-1.5">
                Avatar Image URL
              </label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="w-full py-2.5 px-3.5 rounded-xl glass-input text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-dark-300 mb-1.5">
                Bio
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full p-3 rounded-xl glass-input text-sm resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-dark-300 mb-1.5">
                Interests (comma separated)
              </label>
              <input
                type="text"
                value={interestsInput}
                onChange={(e) => setInterestsInput(e.target.value)}
                placeholder="Technology, AI, Startups, Gaming"
                className="w-full py-2.5 px-3.5 rounded-xl glass-input text-sm"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                {error}
              </div>
            )}

            {saveSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Profile updated successfully!</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-brand-indigo hover:bg-brand-purple text-white transition-all flex items-center gap-2 shadow-md shadow-brand-indigo/30 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Changes...' : 'Save Profile'}</span>
            </button>
          </form>
        </div>

        {/* Right Col: Nexconn SDK Connection Inspector */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-blue-500/20 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Wifi className="w-4 h-4 text-brand-blue" />
              <span>Nexconn SDK Inspector</span>
            </h3>

            <div className="space-y-2.5 text-xs text-dark-300">
              <div className="p-2.5 rounded-xl bg-dark-900 border border-white/5 flex items-center justify-between">
                <span>SDK Status:</span>
                <span
                  className={`font-semibold ${
                    nexconnStatus.toLowerCase() === 'connected'
                      ? 'text-emerald-400'
                      : nexconnStatus.toLowerCase().includes('connecting')
                      ? 'text-amber-400'
                      : 'text-slate-400'
                  }`}
                >
                  {nexconnStatus}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-dark-900 border border-white/5 space-y-1">
                <span className="block text-[11px] text-dark-400">Current User Token:</span>
                <span className="font-mono text-[10px] text-brand-indigo break-all block">
                  {user?.nexconnToken || 'Not issued'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-dark-900 border border-white/5 flex items-center justify-between">
                <span>Data Center:</span>
                <span className="font-mono text-[11px] text-dark-200">api.sg-light-api.com</span>
              </div>
            </div>

            <button
              onClick={handleRefreshToken}
              disabled={isRefreshingToken}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-dark-900 hover:bg-dark-800 text-dark-200 hover:text-white border border-white/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingToken ? 'animate-spin' : ''}`} />
              <span>Refresh Access Token</span>
            </button>
          </div>

          {/* Joined Communities Summary */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-indigo" />
              <span>Joined Communities</span>
            </h3>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {(user?.joinedCommunities || []).length === 0 ? (
                <p className="text-xs text-dark-400">No communities joined yet.</p>
              ) : (
                (user?.joinedCommunities || []).map((c: any) => (
                  <Link
                    key={c._id || c}
                    to={`/community/${c.slug || ''}`}
                    className="p-2 rounded-xl bg-dark-900 hover:bg-dark-800 flex items-center gap-2 text-xs text-white transition-colors"
                  >
                    <span className="w-2 h-2 rounded-full bg-brand-indigo" />
                    <span className="truncate">{c.name || 'Community'}</span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

