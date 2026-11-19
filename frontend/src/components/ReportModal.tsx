import React, { useState } from 'react';
import { X, ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { moderationApi } from '../services/api';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageId?: string;
  channelId?: string;
  channelType?: string;
  content?: string;
  reportedUserId?: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  messageId,
  channelId,
  channelType = 'group',
  content,
  reportedUserId,
}) => {
  const [reason, setReason] = useState('Inappropriate or offensive content');
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const fullReason = reason === 'Other' ? customReason : reason;

    try {
      const res = await moderationApi.reportMessage({
        messageId,
        channelId,
        channelType,
        content,
        reason: fullReason,
        reportedUserId,
      });

      if (res.data?.success) {
        setSuccessResult(res.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDone = () => {
    setSuccessResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl glass-panel p-6 shadow-2xl border border-white/10 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {successResult ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Report Submitted</h3>
            <p className="text-sm text-dark-300 mb-4">
              Thank you for keeping ConnectSphere safe. Our AI Moderation Engine has scanned this report and queued it for review.
            </p>
            {successResult.aiFlagged && (
              <div className="p-3 mb-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2 text-left">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>SphereAI flagged this message with high toxicity score for immediate moderator action.</span>
              </div>
            )}
            <button
              onClick={handleDone}
              className="w-full py-2.5 rounded-xl font-medium bg-brand-indigo text-white hover:bg-brand-purple transition-all"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Report Message</h3>
                <p className="text-xs text-dark-400">SphereAI Smart Moderation Assistant</p>
              </div>
            </div>

            {content && (
              <div className="p-3 rounded-xl bg-dark-900 border border-white/5 text-xs text-dark-300">
                <span className="block font-medium text-dark-400 mb-1">Reported snippet:</span>
                <p className="italic text-white/90 line-clamp-3">"{content}"</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-dark-300 mb-1.5">
                Why are you reporting this?
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl glass-input text-sm"
              >
                <option value="Inappropriate or offensive content">Inappropriate or offensive content</option>
                <option value="Harassment, hate speech or bullying">Harassment, hate speech or bullying</option>
                <option value="Spam or unsolicited commercial promotion">Spam or unsolicited commercial promotion</option>
                <option value="Misinformation or harmful advice">Misinformation or harmful advice</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {reason === 'Other' && (
              <div>
                <label className="block text-xs font-semibold text-dark-300 mb-1.5">
                  Details:
                </label>
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Please describe why this content violates community guidelines..."
                  required
                  rows={3}
                  className="w-full p-3 rounded-xl glass-input text-sm resize-none"
                />
              </div>
            )}

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
                className="flex-1 py-2.5 rounded-xl font-medium bg-red-600 hover:bg-red-500 text-white transition-all text-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Analyzing...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

