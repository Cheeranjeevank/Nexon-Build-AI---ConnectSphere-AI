import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi, communityApi, aiApi } from '../services/api';
import { nexconnChat, ChatMessage } from '../services/nexconnChat';
import {
  MessageSquare,
  Users,
  Search,
  Send,
  Paperclip,
  Sparkles,
  ShieldAlert,
  Wifi,
  Smile,
  MoreVertical,
  Check,
  CheckCheck,
  AlertCircle,
  Clock,
  WifiOff,
} from 'lucide-react';
import { ReportModal } from '../components/ReportModal';

interface ConversationItem {
  id: string; // userId or groupId
  name: string;
  avatarUrl: string;
  type: 'direct' | 'group';
  subtitle: string;
  unreadCount?: number;
}

export const MessagesPage: React.FC = () => {
  const { user, nexconnStatus } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<'direct' | 'groups'>('direct');
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isPolishing, setIsPolishing] = useState(false);
  const [reportTarget, setReportTarget] = useState<any | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch initial conversations list (other users + joined communities)
  useEffect(() => {
    const loadConversations = async () => {
      try {
        // Fetch users for direct messages
        const usersRes = await authApi.searchUsers();
        const dmItems: ConversationItem[] = (usersRes.data?.users || []).map((u: any) => ({
          id: u._id,
          name: u.name,
          avatarUrl: u.avatarUrl,
          type: 'direct',
          subtitle: `@${u.username} • ${u.isOnline ? 'Online' : 'Offline'}`,
          unreadCount: 0,
        }));

        // Fetch communities for group messages
        const commRes = await communityApi.getCommunities();
        const groupItems: ConversationItem[] = (commRes.data?.communities || []).map((c: any) => ({
          id: c.nexconnGroupId,
          name: c.name,
          avatarUrl: c.avatarUrl,
          type: 'group',
          subtitle: `${c.category} • ${c.membersCount || 1} members`,
          unreadCount: 0,
        }));

        setConversations([...dmItems, ...groupItems]);

        // Select first or URL specified conversation
        const targetParam = searchParams.get('target');
        const found = [...dmItems, ...groupItems].find((c) => c.id === targetParam);
        if (found) {
          setActiveConversation(found);
          setActiveTab(found.type === 'direct' ? 'direct' : 'groups');
        } else if (dmItems.length > 0) {
          setActiveConversation(dmItems[0]);
        }
      } catch (err) {
        console.warn('Failed to load conversations:', err);
      }
    };

    loadConversations();
  }, []);

  // Load message history when active conversation changes
  useEffect(() => {
    if (!activeConversation) return;

    const fetchHistory = async () => {
      try {
        const history = await nexconnChat.loadHistory(
          activeConversation.type,
          activeConversation.id
        );
        setMessages(history);
      } catch (e) {
        console.warn('Load history error:', e);
      }
    };

    fetchHistory();
  }, [activeConversation]);

  // Subscribe to real-time incoming messages via Nexconn Chat SDK
  useEffect(() => {
    const unsubscribe = nexconnChat.onMessage((newMsg) => {
      if (activeConversation && newMsg.targetId === activeConversation.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.messageId === newMsg.messageId)) return prev;
          return [...prev, newMsg];
        });
      }
    });

    return unsubscribe;
  }, [activeConversation]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConversation || isSending) return;

    const text = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      if (activeConversation.type === 'direct') {
        await nexconnChat.sendDirectMessage(
          activeConversation.id,
          text,
          user?.name || 'You',
          user?.avatarUrl
        );
      } else {
        await nexconnChat.sendGroupMessage(
          activeConversation.id,
          text,
          user?.name || 'You',
          user?.avatarUrl
        );
      }
    } catch (err) {
      console.warn('Send error:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConversation) return;

    try {
      await nexconnChat.sendMediaMessage(
        activeConversation.id,
        activeConversation.type,
        file
      );
    } catch (err) {
      console.warn('File send error:', err);
    }
  };

  // AI Tone Polish
  const handlePolishMessage = async () => {
    if (!inputText.trim() || isPolishing) return;
    setIsPolishing(true);
    try {
      const res = await aiApi.ask({
        question: `Rewrite this message to be clear, professional, friendly, and engaging for a community chat: "${inputText}"`,
      });
      if (res.data?.answer) {
        // Strip quotes if present
        const cleaned = res.data.answer.replace(/^"|"$/g, '');
        setInputText(cleaned);
      }
    } catch (e) {
      console.warn('AI polish error:', e);
    } finally {
      setIsPolishing(false);
    }
  };

  const filteredConversations = conversations
    .filter((c) => (activeTab === 'direct' ? c.type === 'direct' : c.type === 'group'))
    .filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden flex flex-col md:flex-row h-[calc(100vh-8.5rem)] shadow-2xl">
        {/* Left Sidebar: Conversations List */}
        <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-white/10 bg-dark-900/60 flex flex-col flex-shrink-0">
          {/* Header & Tabs */}
          <div className="p-4 border-b border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-brand-indigo" />
                <span>Nexconn Chat</span>
              </h2>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  nexconnStatus.toLowerCase() === 'connected'
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    : nexconnStatus.toLowerCase().includes('connecting')
                    ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                    : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                }`}
              >
                {nexconnStatus}
              </span>
            </div>

            {/* Direct / Group Tabs */}
            <div className="flex bg-dark-950 p-1 rounded-xl border border-white/5">
              <button
                onClick={() => setActiveTab('direct')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'direct'
                    ? 'bg-brand-indigo text-white shadow-md'
                    : 'text-dark-400 hover:text-white'
                }`}
              >
                1-on-1 Direct
              </button>
              <button
                onClick={() => setActiveTab('groups')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'groups'
                    ? 'bg-brand-indigo text-white shadow-md'
                    : 'text-dark-400 hover:text-white'
                }`}
              >
                Group Channels
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-dark-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter conversations..."
                className="w-full pl-9 pr-3 py-2 rounded-xl glass-input text-xs"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {filteredConversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-dark-400">
                No {activeTab === 'direct' ? 'direct messages' : 'groups'} found.
              </div>
            ) : (
              filteredConversations.map((item) => {
                const isSelected = activeConversation?.id === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveConversation(item);
                      setSearchParams({ target: item.id });
                    }}
                    className={`w-full p-3.5 flex items-center gap-3 text-left transition-all ${
                      isSelected
                        ? 'bg-brand-indigo/15 border-l-4 border-brand-indigo'
                        : 'hover:bg-dark-800/60'
                    }`}
                  >
                    <img
                      src={item.avatarUrl}
                      alt={item.name}
                      className="w-10 h-10 rounded-full object-cover ring-1 ring-white/10 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-bold text-white truncate">{item.name}</span>
                        {item.unreadCount ? (
                          <span className="w-4 h-4 rounded-full bg-brand-rose text-[10px] font-bold text-white flex items-center justify-center">
                            {item.unreadCount}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-[11px] text-dark-400 truncate">{item.subtitle}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Active Chat Pane */}
        {activeConversation ? (
          <div className="flex-1 flex flex-col h-full bg-dark-950/40">
            {/* Top Chat Bar */}
            <div className="p-4 border-b border-white/10 bg-dark-900/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={activeConversation.avatarUrl}
                  alt={activeConversation.name}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-brand-indigo/30"
                />
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{activeConversation.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-dark-800 text-brand-blue border border-white/5 uppercase">
                      {activeConversation.type}
                    </span>
                  </h3>
                  <span className="text-[11px] text-dark-400">{activeConversation.subtitle}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Nexconn Live Channel</span>
                </span>
              </div>
            </div>

            {/* Messages Thread */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-dark-400">
                  <div className="w-12 h-12 rounded-2xl bg-dark-900 border border-white/5 flex items-center justify-center mb-3">
                    <MessageSquare className="w-6 h-6 text-dark-500" />
                  </div>
                  <h4 className="text-sm font-semibold text-white mb-1">No messages yet</h4>
                  <p className="text-xs max-w-xs text-dark-400">
                    Be the first to say hello in this {activeConversation.type === 'direct' ? 'direct message' : 'group channel'}!
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
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
                        alt="avatar"
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
                                  channelId: activeConversation.id,
                                  channelType: activeConversation.type,
                                  content: msg.content,
                                  reportedUserId: msg.senderUserId,
                                })
                              }
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-dark-400 hover:text-red-400"
                              title="Report message"
                            >
                              <ShieldAlert className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div
                          className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                            isMe
                              ? msg.status === 'failed'
                                ? 'bg-rose-950/80 border border-rose-500/30 text-rose-100 rounded-tr-none'
                                : 'bg-brand-indigo text-white rounded-tr-none shadow-md shadow-brand-indigo/20'
                              : 'bg-dark-900 border border-white/5 text-dark-200 rounded-tl-none'
                          }`}
                        >
                          {msg.content}
                          {msg.mediaUrl && (
                            <div className="mt-2">
                              <img
                                src={msg.mediaUrl}
                                alt="attachment"
                                className="max-h-48 rounded-xl object-contain"
                              />
                            </div>
                          )}
                        </div>

                        {isMe && (
                          <div className="flex items-center justify-end gap-1 mt-1 text-[10px]">
                            {msg.status === 'failed' ? (
                              <span className="flex items-center gap-1 text-rose-400 font-medium">
                                <AlertCircle className="w-3 h-3 text-rose-400" />
                                <span>Failed to deliver</span>
                              </span>
                            ) : msg.status === 'sending' ? (
                              <span className="flex items-center gap-1 text-amber-400">
                                <Clock className="w-3 h-3 animate-spin" />
                                <span>Sending...</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-dark-400">
                                <CheckCheck className="w-3 h-3 text-brand-blue" />
                                <span>Delivered</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Composer */}
            <div className="p-3 sm:p-4 border-t border-white/10 bg-dark-900/60">
              <form onSubmit={handleSendMessage} className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 rounded-xl text-dark-400 hover:text-white hover:bg-dark-800 transition-colors"
                    title="Attach file or image"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={`Message ${activeConversation.name} (Nexconn Chat SDK)...`}
                    className="flex-1 py-2.5 px-3.5 rounded-xl glass-input text-xs sm:text-sm"
                  />

                  {inputText.trim() && (
                    <button
                      type="button"
                      onClick={handlePolishMessage}
                      disabled={isPolishing}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-brand-purple/20 text-purple-300 hover:bg-brand-purple/30 border border-brand-purple/30 transition-all flex items-center gap-1"
                      title="Polish with SphereAI"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">
                        {isPolishing ? 'Polishing...' : 'AI Polish'}
                      </span>
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={isSending || !inputText.trim()}
                    className="p-2.5 rounded-xl bg-brand-indigo hover:bg-brand-purple text-white transition-all disabled:opacity-40"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-center text-dark-400">
            Select a conversation on the left to start messaging in real-time.
          </div>
        )}
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={Boolean(reportTarget)}
        onClose={() => setReportTarget(null)}
        {...reportTarget}
      />
    </div>
  );
};

