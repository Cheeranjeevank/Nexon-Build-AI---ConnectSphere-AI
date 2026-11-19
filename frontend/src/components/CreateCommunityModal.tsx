import React, { useState } from 'react';
import { X, Sparkles, Users } from 'lucide-react';
import { communityApi } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface CreateCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (community: any) => void;
}

const CATEGORIES = [
  'Technology',
  'Gaming',
  'Education',
  'Startups',
  'Entertainment',
  'Sports',
  'General discussions',
];

export const CreateCommunityModal: React.FC<CreateCommunityModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Technology');
  const [description, setDescription] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const res = await communityApi.createCommunity({
        name,
        category,
        description,
        avatarUrl:
          avatarUrl ||
          `https://api.dicebear.com/7.x/identicon/svg?seed=${name}&backgroundColor=0f172a`,
        tags,
      });

      if (res.data?.success && res.data.community) {
        if (onCreated) onCreated(res.data.community);
        onClose();
        navigate(`/community/${res.data.community.slug}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create community');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl glass-panel p-6 shadow-2xl border border-white/10 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-brand-indigo/20 text-brand-indigo border border-brand-indigo/30">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Create New Community</h3>
            <p className="text-xs text-dark-300">
              Real-time Group Chat & Live Discussion Rooms powered by Nexconn
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-dark-300 mb-1.5">
              Community Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Autonomous AI Researchers"
              className="w-full py-2.5 px-3.5 rounded-xl glass-input text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-dark-300 mb-1.5">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl glass-input text-sm"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-dark-300 mb-1.5">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="AI, Agents, Web3"
                className="w-full py-2.5 px-3 rounded-xl glass-input text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark-300 mb-1.5">
              Description *
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what your community explores and collaborates on..."
              className="w-full p-3 rounded-xl glass-input text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark-300 mb-1.5">
              Avatar Image URL (Optional)
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full py-2.5 px-3.5 rounded-xl glass-input text-sm"
            />
          </div>

          <div className="p-3 rounded-xl bg-dark-900 border border-brand-indigo/20 flex items-center gap-2.5 text-xs text-brand-indigo">
            <Sparkles className="w-4 h-4 flex-shrink-0" />
            <span>
              ConnectSphere automatically provisions a <strong>Nexconn Group Channel</strong> and a default <strong>Live Discussion Room</strong>.
            </span>
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl font-medium text-dark-300 hover:text-white bg-dark-800 hover:bg-dark-750 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl font-medium bg-brand-indigo hover:bg-brand-purple text-white transition-all text-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Launch Community'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

