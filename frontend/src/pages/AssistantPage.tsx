import React, { useState, useEffect } from 'react';
import { aiApi, communityApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Send,
  MessageSquare,
  Compass,
  Flame,
  Brain,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Cpu,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AssistantPage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([
    {
      role: 'assistant',
      content:
        'Hello! I am SphereAI, your intelligent community copilot on ConnectSphere. How can I help you today? I can summarize discussions, answer questions, recommend communities, or generate engaging debate topics!',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState<any>(null);
  const [recommended, setRecommended] = useState<any[]>([]);

  useEffect(() => {
    const fetchStatusAndRecs = async () => {
      try {
        const [statusRes, recRes] = await Promise.all([
          aiApi.getStatus().catch(() => ({ data: {} })),
          aiApi.recommendCommunities().catch(() => ({ data: { recommendations: [] } })),
        ]);

        setAiStatus(statusRes.data);
        setRecommended(recRes.data?.recommendations || []);
      } catch (err) {
        console.warn('AI status load error:', err);
      }
    };

    fetchStatusAndRecs();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userText = inputText.trim();
    setInputText('');
    setMessages((prev) => [...prev, { role: 'user', content: userText }]);
    setIsLoading(true);

    try {
      const res = await aiApi.ask({
        question: userText,
        communityContext: `User interests: ${(user?.interests || []).join(', ')}`,
      });

      if (res.data?.success) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: res.data.answer,
            followUps: res.data.followUps,
            provider: res.data.provider,
            generatedBy: res.data.generatedBy,
          },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an issue processing your query. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInputText(prompt);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-brand-purple/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-purple/15 rounded-full blur-[100px] pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-indigo to-brand-violet flex items-center justify-center shadow-lg shadow-brand-indigo/30">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-2xl font-extrabold text-white">SphereAI Copilot</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-purple/20 text-purple-300 border border-brand-purple/30 uppercase tracking-wider">
                  {aiStatus?.configured ? 'Gemini Live' : 'Heuristic Engine'}
                </span>
              </div>
              <p className="text-xs text-dark-300 max-w-xl">
                Real-time conversational synthesis, community matching, and discussion generation for ConnectSphere.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-dark-400 bg-dark-900/80 px-3 py-1.5 rounded-xl border border-white/5">
            <Cpu className="w-4 h-4 text-brand-purple" />
            <span>Active Model: <strong className="text-white">{aiStatus?.model || 'Gemini 1.5 Flash'}</strong></span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Interactive Copilot Chat */}
        <div className="lg:col-span-2 glass-panel rounded-3xl border border-white/10 flex flex-col h-[600px] overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.map((msg, idx) => {
              const isAssistant = msg.role === 'assistant';
              return (
                <div
                  key={idx}
                  className={`flex items-start gap-3 ${!isAssistant ? 'flex-row-reverse' : ''}`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isAssistant
                        ? 'bg-gradient-to-tr from-brand-indigo to-brand-violet text-white shadow-md'
                        : 'bg-dark-800 text-dark-300 ring-1 ring-white/10'
                    }`}
                  >
                    {isAssistant ? <Sparkles className="w-4 h-4" /> : user?.name?.[0] || 'U'}
                  </div>

                  <div className={`max-w-[80%] ${!isAssistant ? 'text-right' : 'text-left'}`}>
                    <div
                      className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        isAssistant
                          ? 'bg-dark-900 border border-white/5 text-dark-200 rounded-tl-none'
                          : 'bg-brand-indigo text-white rounded-tr-none shadow-md shadow-brand-indigo/20'
                      }`}
                    >
                      {msg.content}

                      {msg.followUps && msg.followUps.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/5 space-y-1 text-xs">
                          <span className="font-semibold text-brand-purple block">Suggested follow-ups:</span>
                          {msg.followUps.map((q: string, qIdx: number) => (
                            <button
                              key={qIdx}
                              onClick={() => handleQuickPrompt(q)}
                              className="block text-left text-brand-blue hover:text-white hover:underline transition-colors"
                            >
                              &rarr; {q}
                            </button>
                          ))}
                        </div>
                      )}

                      {msg.role === 'assistant' && msg.provider && (
                        <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-dark-400">
                          {msg.provider === 'gemini' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                              <Sparkles className="w-3 h-3 text-emerald-400" />
                              <span>Google Gemini Live</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
                              <span>Heuristic Fallback</span>
                            </span>
                          )}
                          <span className="text-[9px] text-dark-400">{msg.generatedBy || 'SphereAI'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-indigo to-brand-violet text-white flex items-center justify-center shadow-md animate-pulse">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="p-3.5 rounded-2xl bg-dark-900 border border-white/5 text-xs text-dark-400 animate-pulse">
                  SphereAI is analyzing and generating response...
                </div>
              </div>
            )}
          </div>

          {/* Prompt Suggesters Bar */}
          <div className="px-4 py-2 bg-dark-950/60 border-t border-white/5 flex gap-2 overflow-x-auto scrollbar-none">
            {[
              'Recommend best communities for me',
              'What are trending topics in Tech?',
              'How to structure a live discussion room?',
              'Summarize key ideas for hackathons',
            ].map((p, i) => (
              <button
                key={i}
                onClick={() => handleQuickPrompt(p)}
                className="text-[11px] whitespace-nowrap px-3 py-1 rounded-lg bg-dark-900 hover:bg-brand-indigo/20 text-dark-300 hover:text-white border border-white/5 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 sm:p-4 border-t border-white/10 bg-dark-900/80 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask SphereAI anything about communities, discussions, or code..."
              className="flex-1 py-2.5 px-3.5 rounded-xl glass-input text-xs sm:text-sm"
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="p-2.5 rounded-xl bg-brand-indigo hover:bg-brand-purple text-white transition-all disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Right Col: AI Personalized Recommendations */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-brand-blue" />
              <span>Personalized Community Recommendations</span>
            </h3>
            <p className="text-xs text-dark-300">
              Matched against your profile interests: <strong className="text-white">{(user?.interests || []).join(', ')}</strong>
            </p>

            <div className="space-y-3 pt-2">
              {recommended.length === 0 ? (
                <div className="p-4 rounded-2xl bg-dark-900 text-center text-xs text-dark-400">
                  Recommendations loading...
                </div>
              ) : (
                recommended.map((rec, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-2xl bg-dark-900/80 border border-white/5 space-y-2 hover:border-brand-indigo/30 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white">{rec.communityName}</h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {rec.matchScore}% Match
                      </span>
                    </div>
                    <p className="text-[11px] text-dark-300 leading-relaxed">{rec.reason}</p>
                    <Link
                      to={`/community/${rec.communityId}`}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-blue hover:text-brand-indigo"
                    >
                      <span>Explore Community</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

