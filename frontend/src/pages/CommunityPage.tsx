import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { communityApi, roomApi, aiApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { nexconnChat, ChatMessage } from '../services/nexconnChat';
import {
  Users,
  MessageSquare,
  Flame,
  Sparkles,
  Plus,
  Send,
  Radio,
  Paperclip,
  ShieldAlert,
  ArrowRight,
  LogOut,
  UserPlus,
  FileText,
  Info,
  CheckCircle,
} from 'lucide-react';
import { CreateRoomModal } from '../components/CreateRoomModal';
import { ReportModal } from '../components/ReportModal';

export const CommunityPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [community, setCommunity] = useState<any>(null);
  const [isMember, setIsMember] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'rooms' | 'members' | 'ai'>('chat');
  const [loading, setLoading] = useState(true);

  // Group Chat State (Nexconn GroupChannel)
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Live Discussion Rooms
  const [rooms, setRooms] = useState<any[]>([]);
  const [activeRoom, setActiveRoom] = useState<any | null>(null);
  const [roomMessages, setRoomMessages] = useState<ChatMessage[]>([]);
  const [roomInput, setRoomInput] = useState('');
  const [isRoomSending, setIsRoomSending] = useState(false);
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);

  // SphereAI tab state
  const [aiSummary, setAiSummary] = useState<any | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [askQuestion, setAskQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<any | null>(null);
  const [isAsking, setIsAsking] = useState(false);

  // Report Modal
  const [reportTarget, setReportTarget] = useState<any | null>(null);

  const fetchCommunity = async () => {
    try {
      setLoading(true);
      const res = await communityApi.getCommunityBySlug(slug!);
      if (res.data?.success) {
        setCommunity(res.data.community);
        setIsMember(res.data.isMember);
        setRooms(res.data.discussionRooms || []);

        // Load messages for Nexconn GroupChannel
        if (res.data.community?.nexconnGroupId) {
          const history = await nexconnChat.loadHistory('group', res.data.community.nexconnGroupId);
          setMessages(history);
        }

        // Check if query param specifies room
        const roomIdParam = searchParams.get('room');
        if (roomIdParam && res.data.discussionRooms) {
          const found = res.data.discussionRooms.find((r: any) => r._id === roomIdParam);
          if (found) {
            handleJoinRoom(found);
            setActiveTab('rooms');
          }
        }
      }
    } catch (err) {
      console.warn('Error fetching community:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunity();
  }, [slug]);

  // Subscribe to real-time incoming messages via Nexconn Chat SDK
  useEffect(() => {
    const unsubscribe = nexconnChat.onMessage((newMsg) => {
      if (community?.nexconnGroupId && newMsg.targetId === community.nexconnGroupId) {
        setMessages((prev) => {
          if (prev.some((m) => m.messageId === newMsg.messageId)) return prev;
          return [...prev, newMsg];
        });
      }
      if (activeRoom?.openChannelId && newMsg.targetId === activeRoom.openChannelId) {
        setRoomMessages((prev) => {
          if (prev.some((m) => m.messageId === newMsg.messageId)) return prev;
          return [...prev, newMsg];
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [community, activeRoom]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, roomMessages, activeTab]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !community?.nexconnGroupId || isSending) return;

    const text = inputMessage.trim();
    setInputMessage('');
    setIsSending(true);

    try {
      await nexconnChat.sendGroupMessage(
        community.nexconnGroupId,
        text,
        user?.name || 'You',
        user?.avatarUrl
      );
    } catch (err) {
      console.warn('Send error:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendRoomMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomInput.trim() || !activeRoom?.openChannelId || isRoomSending) return;

    const text = roomInput.trim();
    setRoomInput('');
    setIsRoomSending(true);

    try {
      await nexconnChat.sendRoomMessage(
        activeRoom.openChannelId,
        text,
        user?.name || 'You',
        user?.avatarUrl
      );
    } catch (err) {
      console.warn('Send room error:', err);
    } finally {
      setIsRoomSending(false);
    }
  };

  const handleJoinRoom = async (room: any) => {
    try {
      setActiveRoom(room);
      await roomApi.joinRoom(room._id);
      await nexconnChat.joinDiscussionRoom(room.openChannelId);
      const history = await nexconnChat.loadHistory('open', room.openChannelId);
      setRoomMessages(history);
    } catch (err) {
      console.warn('Join room error:', err);
    }
  };

  const handleLeaveRoom = async () => {
    if (!activeRoom) return;
    try {
      await roomApi.leaveRoom(activeRoom._id);
      await nexconnChat.leaveDiscussionRoom();
      setActiveRoom(null);
      setRoomMessages([]);
    } catch (err) {
      console.warn('Leave room error:', err);
    }
  };

  const handleJoinCommunity = async () => {
    if (!community) return;
    try {
      await communityApi.joinCommunity(community._id);
      setIsMember(true);
      setCommunity((prev: any) => ({ ...prev, membersCount: (prev.membersCount || 0) + 1 }));
    } catch (e) {
      console.warn(e);
    }
  };

  const handleLeaveCommunity = async () => {
    if (!community) return;
    try {
      await communityApi.leaveCommunity(community._id);
      setIsMember(false);
      setCommunity((prev: any) => ({ ...prev, membersCount: Math.max(1, (prev.membersCount || 1) - 1) }));
    } catch (e) {
      console.warn(e);
    }
  };

  // AI Summarization
  const handleSummarizeChat = async () => {
    setIsSummarizing(true);
    try {
      const res = await aiApi.summarize({
        messages: messages.slice(-25),
        contextTitle: community?.name,
      });
      if (res.data?.success) {
        setAiSummary(res.data);
      }
    } catch (err) {
      console.warn('Summarize error:', err);
    } finally {
      setIsSummarizing(false);
    }
  };

  // AI Community QA
  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!askQuestion.trim() || isAsking) return;
    setIsAsking(true);
    try {
      const res = await aiApi.ask({
        question: askQuestion.trim(),
        communityContext: `${community?.name} (${community?.category}): ${community?.description}`,
      });
      if (res.data?.success) {
        setAiAnswer(res.data);
      }
    } catch (err) {
      console.warn('Ask error:', err);
    } finally {
      setIsAsking(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="glass-panel p-8 rounded-3xl h-96 animate-pulse" />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Community not found</h2>
        <button
          onClick={() => navigate('/explore')}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-indigo text-white"
        >
          Back to Explore
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Community Banner & Header Card */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-white/10 relative">
        <div className="h-44 sm:h-56 w-full relative overflow-hidden bg-dark-900">
          <img
            src={community.bannerUrl}
            alt={community.name}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/40 to-transparent" />
        </div>

        <div className="p-6 sm:p-8 pt-0 relative -mt-12 sm:-mt-16 flex flex-col md:flex-row md:items-end justify-between gap-6 z-10">
          <div className="flex flex-col sm:flex-row sm:items-end gap-5">
            <img
              src={community.avatarUrl}
              alt={community.name}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover ring-4 ring-dark-950 shadow-2xl flex-shrink-0"
            />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-indigo/20 text-brand-indigo border border-brand-indigo/30 uppercase tracking-wider">
                  {community.category}
                </span>
                <span className="text-xs text-dark-400 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>{community.membersCount || 1} members</span>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {community.name}
              </h1>
              <p className="text-xs sm:text-sm text-dark-300 max-w-2xl mt-1 line-clamp-2">
                {community.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isMember ? (
              <button
                onClick={handleLeaveCommunity}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-dark-300 hover:text-white glass-card hover:bg-red-500/10 hover:border-red-500/30 transition-all flex items-center gap-2"
              >
                <LogOut className="w-4 h-4 text-red-400" />
                <span>Leave</span>
              </button>
            ) : (
              <button
                onClick={handleJoinCommunity}
                className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-brand-blue to-brand-indigo hover:shadow-lg hover:shadow-brand-indigo/30 transition-all flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Join Community</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-t border-white/5 flex gap-1 overflow-x-auto scrollbar-none bg-dark-950/40">
          {[
            { id: 'chat', label: 'Group Chat (Nexconn)', icon: MessageSquare },
            { id: 'rooms', label: `Live Rooms (${rooms.length})`, icon: Flame },
            { id: 'members', label: 'Members', icon: Users },
            { id: 'ai', label: 'SphereAI Assistant', icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-semibold whitespace-nowrap transition-all ${
                  active
                    ? 'border-brand-indigo text-white bg-brand-indigo/5'
                    : 'border-transparent text-dark-400 hover:text-dark-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-brand-indigo' : 'text-dark-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Group Chat powered by Nexconn GroupChannel */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 glass-panel rounded-3xl border border-white/10 flex flex-col h-[600px] overflow-hidden">
            {/* Chat Header */}
            <div className="p-4 border-b border-white/10 bg-dark-900/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4 text-brand-indigo" />
                <div>
                  <h3 className="text-sm font-bold text-white"># {community.name}</h3>
                  <span className="text-[10px] text-dark-400 font-mono">
                    Nexconn Group: {community.nexconnGroupId}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSummarizeChat}
                  disabled={isSummarizing}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-brand-purple/20 text-purple-300 hover:bg-brand-purple/30 border border-brand-purple/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
                  title="Summarize conversation with SphereAI"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isSummarizing ? 'Summarizing...' : 'AI Summary'}</span>
                </button>
              </div>
            </div>

            {/* Quick summary inline banner if available */}
            {aiSummary && (
              <div className="p-3 bg-brand-purple/10 border-b border-brand-purple/20 text-xs text-purple-200 flex items-start gap-2 animate-in fade-in">
                <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold text-white block mb-0.5">SphereAI Channel Summary:</span>
                  <p className="line-clamp-2">{aiSummary.summary}</p>
                </div>
                <button
                  onClick={() => setActiveTab('ai')}
                  className="text-brand-blue hover:underline text-[11px] font-semibold flex-shrink-0"
                >
                  Full View
                </button>
              </div>
            )}

            {/* Messages Thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => {
                const isMe = msg.isSelf || msg.senderUserId === user?._id;
                return (
                  <div
                    key={msg.messageId}
                    className={`flex items-start gap-3 group ${isMe ? 'flex-row-reverse' : ''}`}
                  >
                    <img
                      src={
                        msg.senderAvatar ||
                        `https://api.dicebear.com/7.x/identicon/svg?seed=${msg.senderUserId}`
                      }
                      alt={msg.senderName}
                      className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10 flex-shrink-0 mt-0.5"
                    />
                    <div className={`max-w-[75%] ${isMe ? 'text-right' : 'text-left'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-white">
                          {isMe ? 'You' : msg.senderName || msg.senderUserId}
                        </span>
                        <span className="text-[10px] text-dark-400 font-mono">
                          {new Date(msg.sentTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {!isMe && (
                          <button
                            onClick={() =>
                              setReportTarget({
                                messageId: msg.messageId,
                                channelId: community.nexconnGroupId,
                                channelType: 'group',
                                content: msg.content,
                                reportedUserId: msg.senderUserId,
                              })
                            }
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-dark-400 hover:text-red-400"
                            title="Report message"
                          >
                            <ShieldAlert className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <div
                        className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                          isMe
                            ? 'bg-brand-indigo text-white rounded-tr-none shadow-md shadow-brand-indigo/20'
                            : 'bg-dark-900 border border-white/5 text-dark-200 rounded-tl-none'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Composer */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 border-t border-white/10 bg-dark-900/60 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={`Message #${community.name} (via Nexconn Chat SDK)...`}
                className="flex-1 py-2.5 px-3.5 rounded-xl glass-input text-xs sm:text-sm"
              />
              <button
                type="submit"
                disabled={isSending || !inputMessage.trim()}
                className="p-2.5 rounded-xl bg-brand-indigo hover:bg-brand-purple text-white transition-all disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Right Sidebar: Rules & Info */}
          <div className="space-y-6">
            <div className="glass-panel p-5 rounded-3xl border border-white/10">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-blue" />
                <span>Community Guidelines</span>
              </h4>
              <ul className="space-y-2 text-xs text-dark-300">
                {(community.rules || []).map((rule: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-brand-indigo font-bold">{idx + 1}.</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-panel p-5 rounded-3xl border border-white/10">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                Community Owner
              </h4>
              <div className="flex items-center gap-3">
                <img
                  src={community.owner?.avatarUrl}
                  alt={community.owner?.name}
                  className="w-10 h-10 rounded-xl object-cover ring-1 ring-white/10"
                />
                <div>
                  <h5 className="text-xs font-bold text-white">{community.owner?.name}</h5>
                  <p className="text-[11px] text-dark-400">@{community.owner?.username}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Live Discussion Rooms (Nexconn OpenChannel) */}
      {activeTab === 'rooms' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
                <span>Live Discussion Rooms</span>
              </h3>
              <p className="text-xs text-dark-300">
                Topic-based live rooms powered by Nexconn Open Channels. Enter, collaborate, and share ideas.
              </p>
            </div>

            <button
              onClick={() => setIsCreateRoomOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500 to-rose-500 text-white hover:opacity-90 transition-all flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Start New Room</span>
            </button>
          </div>

          {activeRoom ? (
            /* Active Live Room View */
            <div className="glass-panel rounded-3xl border border-amber-500/30 overflow-hidden flex flex-col h-[550px]">
              <div className="p-4 bg-amber-950/20 border-b border-amber-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                    <Radio className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{activeRoom.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {activeRoom.participantCount || 1} online
                      </span>
                    </h4>
                    <p className="text-xs text-amber-300/80">{activeRoom.topic}</p>
                  </div>
                </div>

                <button
                  onClick={handleLeaveRoom}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-dark-900 text-dark-300 hover:text-white border border-white/10"
                >
                  Leave Room
                </button>
              </div>

              {/* Room messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {roomMessages.map((msg) => {
                  const isMe = msg.isSelf || msg.senderUserId === user?._id;
                  return (
                    <div
                      key={msg.messageId}
                      className={`flex items-start gap-3 ${isMe ? 'flex-row-reverse' : ''}`}
                    >
                      <img
                        src={
                          msg.senderAvatar ||
                          `https://api.dicebear.com/7.x/identicon/svg?seed=${msg.senderUserId}`
                        }
                        alt="avatar"
                        className="w-7 h-7 rounded-full object-cover ring-1 ring-white/10"
                      />
                      <div className={`max-w-[70%] ${isMe ? 'text-right' : 'text-left'}`}>
                        <span className="text-[11px] font-bold text-white block mb-0.5">
                          {isMe ? 'You' : msg.senderName || msg.senderUserId}
                        </span>
                        <div
                          className={`p-3 rounded-2xl text-xs sm:text-sm ${
                            isMe
                              ? 'bg-amber-600 text-white rounded-tr-none'
                              : 'bg-dark-900 border border-white/5 text-dark-200 rounded-tl-none'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Room input */}
              <form
                onSubmit={handleSendRoomMessage}
                className="p-3 border-t border-white/10 bg-dark-900/80 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value)}
                  placeholder="Share your thoughts in this live discussion room..."
                  className="flex-1 py-2.5 px-3.5 rounded-xl glass-input text-xs sm:text-sm"
                />
                <button
                  type="submit"
                  disabled={isRoomSending || !roomInput.trim()}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white transition-all disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            /* Rooms List */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => (
                <div
                  key={room._id}
                  className="glass-card p-5 rounded-2xl flex flex-col justify-between border border-white/5 hover:border-amber-500/30 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {room.participantCount || 1} Participating
                      </span>
                      <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
                    </div>

                    <h4 className="text-sm font-bold text-white mb-1">{room.name}</h4>
                    <p className="text-xs text-dark-300 line-clamp-2 mb-3">{room.topic}</p>

                    {room.tags && room.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {room.tags.map((tag: string) => (
                          <span
                            key={tag}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-dark-900 text-dark-400 border border-white/5"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleJoinRoom(room)}
                    className="w-full py-2 rounded-xl text-xs font-semibold bg-dark-800 hover:bg-amber-500 hover:text-white text-dark-200 border border-white/5 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Enter Live Room</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Members */}
      {activeTab === 'members' && (
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <h3 className="text-base font-bold text-white">Community Members</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {community.members && community.members.length > 0 ? (
              community.members.map((m: any) => (
                <div
                  key={m._id}
                  className="p-3.5 rounded-2xl bg-dark-900 border border-white/5 flex items-center gap-3"
                >
                  <img
                    src={m.user?.avatarUrl}
                    alt={m.user?.name}
                    className="w-10 h-10 rounded-xl object-cover ring-1 ring-white/10"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-white">{m.user?.name}</h4>
                    <p className="text-[10px] text-dark-400">@{m.user?.username}</p>
                    <span className="inline-block mt-0.5 text-[9px] px-1.5 py-0.2 rounded bg-dark-800 text-brand-blue uppercase">
                      {m.role || 'Member'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-dark-400">No members listed.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: SphereAI Assistant */}
      {activeTab === 'ai' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Conversation Summarizer Card */}
          <div className="glass-panel p-6 rounded-3xl border border-brand-purple/30 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-purple" />
                <h3 className="text-base font-bold text-white">Channel Summarizer</h3>
              </div>
              <button
                onClick={handleSummarizeChat}
                disabled={isSummarizing}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-brand-purple text-white hover:bg-brand-violet transition-all disabled:opacity-50"
              >
                {isSummarizing ? 'Synthesizing...' : 'Summarize Thread'}
              </button>
            </div>

            {aiSummary ? (
              <div className="space-y-4 text-xs text-dark-200">
                <div className="p-3.5 rounded-2xl bg-dark-900 border border-white/5">
                  <span className="font-bold text-white block mb-1">Executive Summary</span>
                  <p className="leading-relaxed text-dark-300">{aiSummary.summary}</p>
                </div>

                {aiSummary.keyTakeaways && aiSummary.keyTakeaways.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-dark-900 border border-white/5">
                    <span className="font-bold text-white block mb-1.5">Key Takeaways</span>
                    <ul className="space-y-1 text-dark-300 list-disc list-inside">
                      {aiSummary.keyTakeaways.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-dark-400 pt-2">
                  <span>Tone: <strong className="text-brand-blue uppercase">{aiSummary.sentiment || 'Productive'}</strong></span>
                  <span>{aiSummary.generatedBy || 'Powered by SphereAI'}</span>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-dark-400">
                Click "Summarize Thread" to generate a multi-point executive summary of the messages exchanged in this community.
              </div>
            )}
          </div>

          {/* Ask Community Assistant Card */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-blue" />
              <h3 className="text-base font-bold text-white">Ask SphereAI</h3>
            </div>

            <form onSubmit={handleAskQuestion} className="space-y-3">
              <input
                type="text"
                value={askQuestion}
                onChange={(e) => setAskQuestion(e.target.value)}
                placeholder="Ask anything about this community's topic or best practices..."
                className="w-full py-2.5 px-3.5 rounded-xl glass-input text-xs sm:text-sm"
              />
              <button
                type="submit"
                disabled={isAsking || !askQuestion.trim()}
                className="w-full py-2.5 rounded-xl text-xs font-semibold bg-brand-indigo hover:bg-brand-purple text-white transition-all disabled:opacity-50"
              >
                {isAsking ? 'Generating Answer...' : 'Ask Question'}
              </button>
            </form>

            {aiAnswer && (
              <div className="p-4 rounded-2xl bg-dark-900 border border-white/5 text-xs text-dark-300 space-y-3">
                <div>
                  <span className="font-bold text-white block mb-1">Answer</span>
                  <p className="leading-relaxed">{aiAnswer.answer}</p>
                </div>
                {aiAnswer.followUps && (
                  <div>
                    <span className="font-semibold text-white block mb-1">Recommended Follow-Ups</span>
                    <ul className="space-y-1 text-brand-blue">
                      {aiAnswer.followUps.map((q: string, idx: number) => (
                        <li
                          key={idx}
                          className="cursor-pointer hover:underline"
                          onClick={() => setAskQuestion(q)}
                        >
                          &bull; {q}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateRoomModal
        isOpen={isCreateRoomOpen}
        onClose={() => setIsCreateRoomOpen(false)}
        communityId={community._id}
        communityName={community.name}
        category={community.category}
        onCreated={(room) => {
          setRooms((prev) => [room, ...prev]);
          handleJoinRoom(room);
          setActiveTab('rooms');
        }}
      />

      <ReportModal
        isOpen={Boolean(reportTarget)}
        onClose={() => setReportTarget(null)}
        {...reportTarget}
      />
    </div>
  );
};

