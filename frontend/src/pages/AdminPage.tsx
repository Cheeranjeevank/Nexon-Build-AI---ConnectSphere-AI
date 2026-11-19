import React, { useState, useEffect } from 'react';
import { moderationApi, communityApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  MessageSquare,
  Flame,
  Check,
  X,
  AlertTriangle,
  RefreshCw,
  Server,
  Cpu,
  Layers,
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchAdminData = async () => {
    try {
      setIsLoading(true);
      const [statsRes, reportsRes] = await Promise.all([
        moderationApi.getStats().catch(() => ({ data: { stats: {} } })),
        moderationApi.getReports(selectedStatus).catch(() => ({ data: { reports: [] } })),
      ]);

      setStats(statsRes.data?.stats);
      setReports(reportsRes.data?.reports || []);
    } catch (err) {
      console.warn('Admin fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [selectedStatus]);

  const handleResolve = async (id: string, status: 'action_taken' | 'dismissed') => {
    try {
      setActionLoadingId(id);
      await moderationApi.resolveReport(id, {
        status,
        actionNotes: `Reviewed and marked as ${status} by ${user?.name}`,
      });
      setReports((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status, reviewedBy: user } : r))
      );
      if (stats) {
        setStats({
          ...stats,
          pendingReports: Math.max(0, (stats.pendingReports || 1) - 1),
        });
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-6 h-6 text-brand-indigo" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Community Moderation & Administration
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-dark-300">
            Real-time content moderation, AI toxicity scoring, and ConnectSphere system diagnostics.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-dark-900 hover:bg-dark-800 text-white border border-white/10 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'text-blue-400' },
          { label: 'Communities', value: stats?.totalCommunities || 0, icon: Layers, color: 'text-indigo-400' },
          { label: 'Discussion Rooms', value: stats?.totalRooms || 0, icon: Flame, color: 'text-amber-400' },
          { label: 'Total Reports', value: stats?.totalReports || 0, icon: ShieldAlert, color: 'text-purple-400' },
          { label: 'Pending Review', value: stats?.pendingReports || 0, icon: AlertTriangle, color: 'text-rose-400' },
          { label: 'Action Taken', value: stats?.actionTakenReports || 0, icon: Check, color: 'text-emerald-400' },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="glass-card p-4 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-dark-400 uppercase">{item.label}</span>
                <Icon className={`w-4 h-4 ${item.color}`} />
              </div>
              <p className="text-2xl font-extrabold text-white">{item.value}</p>
            </div>
          );
        })}
      </div>

      {/* System Infrastructure Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-5 rounded-2xl border border-blue-500/20 bg-blue-950/10">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 mb-2">
            <Server className="w-4 h-4" />
            <span>Nexconn Chat Server Infrastructure</span>
          </div>
          <div className="space-y-1.5 text-xs text-dark-300">
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="text-emerald-400 font-semibold">Active & Responsive</span>
            </div>
            <div className="flex justify-between">
              <span>Data Center:</span>
              <span className="font-mono text-dark-200">Singapore (api.sg-light-api.com)</span>
            </div>
            <div className="flex justify-between">
              <span>Signature Mode:</span>
              <span className="font-mono text-dark-200">SHA-1 HMAC Nonce/Timestamp</span>
            </div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-purple-500/20 bg-purple-950/10">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-400 mb-2">
            <Cpu className="w-4 h-4" />
            <span>SphereAI Content Moderation Engine</span>
          </div>
          <div className="space-y-1.5 text-xs text-dark-300">
            <div className="flex justify-between">
              <span>Toxicity Scanner:</span>
              <span className="text-emerald-400 font-semibold">Active (Threshold 0.70)</span>
            </div>
            <div className="flex justify-between">
              <span>AI Engine:</span>
              <span className="font-mono text-dark-200">
                {stats?.aiConfigured ? 'Gemini 1.5 Live' : 'Heuristic Safety Engine'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Flagged Categories:</span>
              <span className="font-mono text-dark-200">Spam, Harassment, Hate, Abuse</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reported Messages Queue Table */}
      <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden space-y-4">
        <div className="p-6 pb-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              <span>Flagged & Reported Messages Queue</span>
            </h3>
            <p className="text-xs text-dark-300">
              Review user reports and automated AI toxicity scans
            </p>
          </div>

          <div className="flex bg-dark-900 p-1 rounded-xl border border-white/5">
            {['all', 'pending', 'action_taken', 'dismissed'].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                  selectedStatus === status
                    ? 'bg-brand-indigo text-white shadow-sm'
                    : 'text-dark-400 hover:text-white'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-dark-900/80 text-dark-400 font-semibold uppercase tracking-wider text-[10px] border-y border-white/5">
              <tr>
                <th className="py-3 px-6">Reported Content</th>
                <th className="py-3 px-4">Reason & Reporter</th>
                <th className="py-3 px-4">SphereAI Scan</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-6 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-dark-400">
                    No reports match the current filter.
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report._id} className="hover:bg-dark-800/40 transition-colors">
                    <td className="py-4 px-6 max-w-xs">
                      <p className="font-medium text-white line-clamp-2">"{report.content}"</p>
                      <span className="text-[10px] text-dark-400 font-mono mt-0.5 block">
                        Channel: {report.channelType} ({report.channelId || 'N/A'})
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <p className="font-semibold text-rose-300">{report.reason}</p>
                      <span className="text-[11px] text-dark-400">
                        by {report.reporter?.name || 'User'}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-dark-300">Toxicity:</span>
                          <span
                            className={`font-mono text-xs font-bold ${
                              (report.aiAnalysis?.toxicityScore || 0) > 0.6
                                ? 'text-red-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {Math.round((report.aiAnalysis?.toxicityScore || 0) * 100)}%
                          </span>
                        </div>
                        {report.aiAnalysis?.flaggedCategories?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {report.aiAnalysis.flaggedCategories.map((c: string) => (
                              <span
                                key={c}
                                className="px-1.5 py-0.2 rounded text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 uppercase"
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          report.status === 'pending'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : report.status === 'action_taken'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-dark-800 text-dark-400'
                        }`}
                      >
                        {report.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      {report.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleResolve(report._id, 'action_taken')}
                            disabled={actionLoadingId === report._id}
                            className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium text-[11px] transition-all flex items-center gap-1 disabled:opacity-50"
                          >
                            <Check className="w-3 h-3" />
                            <span>Action</span>
                          </button>
                          <button
                            onClick={() => handleResolve(report._id, 'dismissed')}
                            disabled={actionLoadingId === report._id}
                            className="px-2.5 py-1 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-300 font-medium text-[11px] transition-all flex items-center gap-1 disabled:opacity-50"
                          >
                            <X className="w-3 h-3" />
                            <span>Dismiss</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-dark-400">Resolved</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

