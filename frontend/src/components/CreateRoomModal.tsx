import React, { useState } from 'react';
import { X, Flame, Sparkles } from 'lucide-react';
import { roomApi, aiApi } from '../services/api';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  communityId: string;
  communityName: string;
  category: string;
  onCreated?: (room: any) => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  communityId,
  communityName,
  category,
  onCreated,
}) => {
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestedTopics, setSuggestedTopics] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSuggest = async () => {
    setIsSuggesting(true);
    setError(null);
    try {
      const res = await aiApi.suggestTopics({ category, communityName, description });
      if (res.data?.topics && res.data.topics.length > 0) {
        setSuggestedTopics(res.data.topics);
      }
    } catch (e: any) {
      console.warn('AI suggest error:', e);
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleSelectSuggested = (t: any) => {
    setName(t.title);
    setTopic(t.description);
    if (t.tags && Array.isArray(t.tags)) {
      setTagsInput(t.tags.join(', '));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const res = await roomApi.createRoom({
        communityId,
        name,
        topic,
        description,
        tags,
      });

      if (res.data?.success && res.data.room) {
        if (onCreated) onCreated(res.data.room);
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create discussion room');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl glass-panel p-6 shadow-2xl border border-white/10 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Start Live Discussion Room</h3>
            <p className="text-xs text-dark-300">
              Interactive topic room powered by Nexconn Open Channels
            </p>
          </div>
        </div>

        {/* AI Topic Suggester Bar */}
        <div className="mb-4 p-3 rounded-xl bg-dark-900 border border-brand-indigo/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-brand-indigo flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Need Inspiration? Ask SphereAI
            </span>
            <button
              type="button"
              onClick={handleSuggest}
              disabled={isSuggesting}
              className="text-xs px-2.5 py-1 rounded-lg bg-brand-indigo/20 text-brand-indigo hover:bg-brand-indigo/30 transition-colors disabled:opacity-50"
            >
              {isSuggesting ? 'Brainstorming...' : 'Suggest Topics'}
            </button>
          </div>

          {suggestedTopics.length > 0 && (
            <div className="space-y-1.5 mt-2">
              <span className="text-[11px] text-dark-400">Click a topic to auto-fill:</span>
              <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto">
                {suggestedTopics.slice(0, 3).map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSuggested(item)}
                    className="text-left p-2 rounded-lg bg-dark-800/80 hover:bg-brand-indigo/20 border border-white/5 hover:border-brand-indigo/30 transition-all text-xs"
                  >
                    <span className="font-semibold text-white block">{item.title}</span>
                    <span className="text-dark-300 text-[11px] line-clamp-1">{item.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-dark-300 mb-1.5">
              Room Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. LLM Quantization Deep Dive"
              className="w-full py-2.5 px-3.5 rounded-xl glass-input text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark-300 mb-1.5">
              Discussion Topic / Guiding Question *
            </label>
            <textarea
              required
              rows={2}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What core theme will members debate or collaborate on?"
              className="w-full p-3 rounded-xl glass-input text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark-300 mb-1.5">
              Room Description & Agenda (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief agenda or background context..."
              className="w-full p-3 rounded-xl glass-input text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark-300 mb-1.5">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="vLLM, Ollama, Performance"
              className="w-full py-2.5 px-3.5 rounded-xl glass-input text-sm"
            />
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
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
              className="flex-1 py-2.5 rounded-xl font-medium bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white transition-all text-sm disabled:opacity-50 font-semibold"
            >
              {isSubmitting ? 'Starting...' : 'Open Live Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

