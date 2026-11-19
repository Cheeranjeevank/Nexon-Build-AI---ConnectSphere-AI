import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { communityApi, roomApi, aiApi } from '../services/api';
import {
  Users,
  MessageSquare,
  Flame,
  Sparkles,
  ArrowRight,
  Compass,
  Plus,
  Radio,
  Wifi,
  ExternalLink,
} from 'lucide-react';
import { CreateCommunityModal } from '../components/CreateCommunityModal';

export const DashboardPage: React.FC = () => {
  const { user, nexconnStatus } = useAuth();
  const [joinedCommunities, setJoinedCommunities] = useState<any[]>([]);
  const [suggestedCommunities, setSuggestedCommunities] = useState<any[]>([]);
  const [activeRooms, setActiveRooms] = useState<any[]>([]);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch communities
        const commRes = await communityApi.getCommunities({ limit: 8 });
        if (commRes.data?.communities) {
          const allComm = commRes.data.communities;
          const userJoinedIds = (user?.joinedCommunities || []).map((c: any) =>
            typeof c === 'string' ? c : c._id
          );

          setJoinedCommunities(
            allComm.filter((c: any) => userJoinedIds.includes(c._id))
          );
          setSuggestedCommunities(
            allComm.filter((c: any) => !userJoinedIds.includes(c._id)).slice(0, 4)
          );
        }

        // Fetch active discussion rooms from prominent communities
        const roomsRes = await roomApi.getRoomsByCommunity('all').catch(() => ({ data: { rooms: [] } }));
        // Or fetch from first community
        if (commRes.data?.communities?.length > 0) {
          const firstComm = commRes.data.communities[0];
          const commRooms = await roomApi.getRoomsByCommunity(firstComm._id).catch(() => ({ data: { rooms: [] } }));
          setActiveRooms(commRooms.data?.rooms || []);
        }

        // Generate quick AI insight
        const statusRes = await aiApi.getStatus().catch(() => ({ data: {} }));
        setAiInsight(
          `Welcome to ConnectSphere! Real-time messaging is powered by the Nexconn Chat SDK Web with token authentication. Communities have active discussion rooms and SphereAI summarization enabled.`
        );
      } catch (err) {
        console.warn('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const handleJoinSuggested = async (id: string) => {
    try {
      await communityApi.joinCommunity(id);
      // Move from suggested to joined
      const joined = suggestedCommunities.find((c) => c._id === id);
      if (joined) {
        setJoinedCommunities((prev) => [...prev, joined]);
        setSuggestedCommunities((prev) => prev.filter((c) => c._id !== id));
      }
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Hero Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl relative overflow-hidden border border-white/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-indigo/15 rounded-full blur-[100px] pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <img
              src={user?.avatarUrl}
              alt={user?.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-4 ring-brand-indigo/30 shadow-xl"
            />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Welcome, {user?.name}!
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-indigo/20 text-brand-indigo border border-brand-indigo/30 uppercase">
                  {user?.role}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-dark-300 max-w-xl">
                {user?.bio || 'Explore communities, collaborate in real time, and share knowledge.'}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1.5 text-xs text-dark-400">
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Nexconn Chat Status: </span>
                  <strong className="text-emerald-400">{nexconnStatus}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-brand-indigo hover:bg-brand-purple transition-all flex items-center justify-center gap-2 shadow-md shadow-brand-indigo/20"
            >
              <Plus className="w-4 h-4" />
              <span>Create Community</span>
            </button>
            <Link
              to="/messages"
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-semibold text-dark-200 hover:text-white glass-card hover:bg-dark-800 transition-all flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4 text-brand-blue" />
              <span>Open Chat</span>
            </Link>
          </div>
        </div>

        {/* AI Daily Highlight Pill */}
        <div className="mt-6 pt-5 border-t border-white/5 flex items-center gap-3 text-xs text-dark-300">
          <div className="p-1.5 rounded-lg bg-brand-purple/20 text-brand-purple flex-shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <p className="flex-1 text-slate-300">
            <strong className="text-white">SphereAI Daily Insight: </strong>
            {aiInsight}
          </p>
          <Link to="/assistant" className="text-brand-blue hover:text-brand-indigo font-medium flex-shrink-0">
            Ask Copilot &rarr;
          </Link>
        </div>
      </div>

      {/* Main Grid: Joined Communities & Active Rooms */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Joined Communities */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-indigo" />
              <h2 className="text-lg font-bold text-white">Your Communities</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-dark-800 text-dark-300 border border-white/5">
                {joinedCommunities.length}
              </span>
            </div>
            <Link
              to="/explore"
              className="text-xs font-semibold text-brand-blue hover:text-brand-indigo flex items-center gap-1"
            >
              <span>Explore More</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {joinedCommunities.length === 0 ? (
            <div className="glass-card p-8 rounded-2xl text-center border-dashed border-white/10">
              <Users className="w-12 h-12 text-dark-500 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-white mb-1">No joined communities yet</h3>
              <p className="text-xs text-dark-300 max-w-sm mx-auto mb-4">
                Explore popular developer, AI, and startup communities to participate in real-time discussions!
              </p>
              <Link
                to="/explore"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-indigo text-white hover:bg-brand-purple transition-all"
              >
                <Compass className="w-4 h-4" />
                <span>Explore Directory</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {joinedCommunities.map((comm) => (
                <Link
                  key={comm._id}
                  to={`/community/${comm.slug}`}
                  className="glass-card p-4 rounded-2xl transition-all duration-200 group flex flex-col justify-between"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <img
                      src={comm.avatarUrl}
                      alt={comm.name}
                      className="w-11 h-11 rounded-xl object-cover ring-2 ring-white/10 group-hover:ring-brand-indigo/40 transition-all flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="inline-block text-[10px] font-semibold text-brand-blue uppercase tracking-wider mb-0.5">
                        {comm.category}
                      </span>
                      <h3 className="text-sm font-bold text-white group-hover:text-brand-blue transition-colors truncate">
                        {comm.name}
                      </h3>
                      <p className="text-xs text-dark-400 line-clamp-2 mt-0.5">
                        {comm.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-dark-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>{comm.membersCount || 1} members</span>
                    </span>
                    <span className="text-brand-indigo group-hover:translate-x-0.5 transition-transform flex items-center gap-1 font-medium">
                      <span>Open Community</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Active Live Discussion Rooms */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
                <h2 className="text-lg font-bold text-white">Active Discussion Rooms</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Live
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {activeRooms.length === 0 ? (
                <div className="glass-card p-6 rounded-2xl text-center text-xs text-dark-400">
                  No active discussion rooms currently in session. Jump into any community to start one!
                </div>
              ) : (
                activeRooms.map((room) => (
                  <div
                    key={room._id}
                    className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 flex-shrink-0">
                        <Radio className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{room.name}</h4>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {room.participantCount || 1} live
                          </span>
                        </div>
                        <p className="text-xs text-dark-300 mt-0.5 line-clamp-1">{room.topic}</p>
                      </div>
                    </div>

                    <Link
                      to={`/community/${room.community?.slug || 'fullstack-devs-hub'}?room=${room._id}`}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500 to-rose-500 text-white hover:opacity-90 transition-all flex items-center gap-1.5 flex-shrink-0"
                    >
                      <span>Join Live Room</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Suggested Communities & Nexconn SDK Info */}
        <div className="space-y-6">
          {/* Suggested Communities */}
          <div className="glass-panel p-5 rounded-3xl border border-white/10">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Compass className="w-4 h-4 text-brand-blue" />
              <span>Suggested Communities</span>
            </h3>

            <div className="space-y-3">
              {suggestedCommunities.map((c) => (
                <div
                  key={c._id}
                  className="p-3 rounded-2xl bg-dark-900/60 border border-white/5 flex items-center justify-between gap-3"
                >
                  <img
                    src={c.avatarUrl}
                    alt={c.name}
                    className="w-9 h-9 rounded-xl object-cover ring-1 ring-white/10"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{c.name}</h4>
                    <p className="text-[10px] text-dark-400">{c.category}</p>
                  </div>
                  <button
                    onClick={() => handleJoinSuggested(c._id)}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-brand-indigo/20 text-brand-indigo hover:bg-brand-indigo hover:text-white transition-all"
                  >
                    Join
                  </button>
                </div>
              ))}
            </div>

            <Link
              to="/explore"
              className="block mt-4 text-center text-xs font-semibold text-brand-blue hover:text-brand-indigo"
            >
              View all communities &rarr;
            </Link>
          </div>

          {/* Nexconn SDK Quick Overview Card */}
          <div className="glass-panel p-5 rounded-3xl border border-blue-500/20 bg-blue-950/20">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400 mb-2 uppercase tracking-wider">
              <Wifi className="w-4 h-4" />
              <span>Nexconn Chat Architecture</span>
            </div>
            <p className="text-xs text-dark-300 leading-relaxed mb-3">
              ConnectSphere handles real-time messaging directly via the <strong>@nexconn/chat</strong> client SDK and backend signing API.
            </p>
            <div className="space-y-1.5 text-[11px] text-dark-400 mb-4">
              <div className="flex justify-between">
                <span>SDK Status:</span>
                <span className="text-emerald-400 font-semibold">{nexconnStatus}</span>
              </div>
              <div className="flex justify-between">
                <span>Data Center:</span>
                <span className="text-dark-200">Singapore (api.sg-light-api.com)</span>
              </div>
              <div className="flex justify-between">
                <span>User Token:</span>
                <span className="text-dark-200">{user?.nexconnToken ? 'Active ✅' : 'Requested'}</span>
              </div>
            </div>
            <a
              href="https://docs.nexconn.ai/"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-brand-blue hover:text-white flex items-center gap-1"
            >
              <span>Nexconn Documentation</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Create Community Modal */}
      <CreateCommunityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={(newComm) => setJoinedCommunities((prev) => [...prev, newComm])}
      />
    </div>
  );
};

