import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  MessageSquare,
  Sparkles,
  Users,
  Flame,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
  Lock,
  Layers,
  Terminal,
} from 'lucide-react';
import { motion } from 'framer-motion';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();

  const handleQuickDemo = async (emailOrUsername: string) => {
    try {
      await login(emailOrUsername, 'password123');
      navigate('/dashboard');
    } catch (e) {
      console.warn('Quick login error:', e);
      navigate('/login');
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none -z-10">
        <div className="absolute top-[-100px] left-1/4 w-[500px] h-[500px] bg-brand-blue/15 rounded-full blur-[140px]" />
        <div className="absolute top-[50px] right-1/4 w-[450px] h-[450px] bg-brand-purple/20 rounded-full blur-[160px]" />
      </div>

      {/* Hero Section */}
      <section className="pt-20 pb-16 sm:pt-28 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto">
          {/* Track Badge */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-brand-indigo/10 border border-brand-indigo/30 text-indigo-300 mb-8 backdrop-blur-md"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-blue animate-pulse" />
            <span>Open Innovation Hackathon • Nexconn Chat SDK Web</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.1]"
          >
            Intelligent Communities.{' '}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-violet-400 bg-clip-text text-transparent">
              Real-Time Synergy.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg sm:text-xl text-dark-200 max-w-2xl mx-auto mb-10 leading-relaxed font-normal"
          >
            ConnectSphere is a next-generation community platform combining{' '}
            <strong className="text-white font-medium">Nexconn Chat SDK</strong> real-time messaging, interactive discussion rooms, AI conversation summaries, and smart moderation.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
          >
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-brand-blue via-brand-indigo to-brand-violet hover:shadow-lg hover:shadow-brand-indigo/30 transition-all flex items-center justify-center gap-2"
              >
                <span>Enter Your Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-brand-blue via-brand-indigo to-brand-violet hover:shadow-lg hover:shadow-brand-indigo/30 transition-all flex items-center justify-center gap-2"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/explore"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-base font-semibold text-dark-200 hover:text-white glass-panel hover:bg-dark-800 transition-all"
                >
                  Explore Communities
                </Link>
              </>
            )}
          </motion.div>

          {/* One-Click Hackathon Demo Launcher */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="inline-block p-4 rounded-2xl glass-panel border border-white/10 max-w-xl mx-auto shadow-xl"
          >
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-dark-300 mb-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Hackathon Judge Quick-Launch (1-Click Login):</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => handleQuickDemo('alex@connectsphere.dev')}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-dark-800 hover:bg-brand-indigo/20 border border-white/5 hover:border-brand-indigo/30 text-white transition-all flex items-center gap-1.5"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Alex (Admin)</span>
              </button>
              <button
                onClick={() => handleQuickDemo('sarah@connectsphere.dev')}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-dark-800 hover:bg-brand-indigo/20 border border-white/5 hover:border-brand-indigo/30 text-white transition-all flex items-center gap-1.5"
              >
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <span>Sarah (AI Lead)</span>
              </button>
              <button
                onClick={() => handleQuickDemo('marcus@connectsphere.dev')}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-dark-800 hover:bg-brand-indigo/20 border border-white/5 hover:border-brand-indigo/30 text-white transition-all flex items-center gap-1.5"
              >
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span>Marcus (Founder)</span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Interactive Feature Cards */}
      <section id="features" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-xs font-bold text-brand-blue tracking-widest uppercase mb-2">
            Engineered For Hackathon Excellence
          </h2>
          <p className="text-3xl font-extrabold text-white tracking-tight">
            Comprehensive Communication Architecture
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Nexconn SDK */}
          <div className="glass-card p-6 rounded-2xl transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-5 border border-blue-500/20">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Nexconn Chat SDK Real-Time Core</h3>
            <p className="text-sm text-dark-300 leading-relaxed mb-4">
              Real-time one-to-one direct messages and group channels powered by the official <code>@nexconn/chat</code> Web SDK with token-based backend signing.
            </p>
            <ul className="space-y-1.5 text-xs text-dark-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>DirectChannel & GroupChannel</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Real-time delivery listeners</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Media & attachment uploads</span>
              </li>
            </ul>
          </div>

          {/* Card 2: AI Community Assistant */}
          <div className="glass-card p-6 rounded-2xl transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-5 border border-purple-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">SphereAI Assistant & Summarizer</h3>
            <p className="text-sm text-dark-300 leading-relaxed mb-4">
              Synthesizes long channel discussions into executive takeaways, answers community questions, and generates viral discussion topics.
            </p>
            <ul className="space-y-1.5 text-xs text-dark-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                <span>Conversation summarization in seconds</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                <span>Personalized community recommendations</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                <span>Gemini API integrated & configurable</span>
              </li>
            </ul>
          </div>

          {/* Card 3: Live Discussion Rooms */}
          <div className="glass-card p-6 rounded-2xl transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-5 border border-amber-500/20">
              <Flame className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Live Discussion Rooms</h3>
            <p className="text-sm text-dark-300 leading-relaxed mb-4">
              Interactive topic rooms using Nexconn Open Channels. Members jump in, debate, share code, and collaborate in real-time.
            </p>
            <ul className="space-y-1.5 text-xs text-dark-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Nexconn OpenChannel architecture</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Active participant counters & presence</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                <span>AI topic generator integration</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Second Row: Moderation & Architecture */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4 border border-rose-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Smart Moderation & Safety</h3>
              <p className="text-sm text-dark-300 leading-relaxed mb-3">
                Automated NLP scanning detects harassment, spam, and abusive messages before they disrupt community harmony. Provides admin review controls and instant report queues.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-dark-900 border border-white/5 text-xs text-dark-400 flex items-center justify-between">
              <span>Automatic toxicity scoring</span>
              <span className="text-emerald-400 font-semibold">Active & Monitored</span>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Zero-Leak Token Architecture</h3>
              <p className="text-sm text-dark-300 leading-relaxed mb-3">
                Adheres strictly to Nexconn security standards: App Secrets stay safely on the backend server. The client SDK only connects via authorized server-issued tokens.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-dark-900 border border-white/5 text-xs text-dark-400 flex items-center justify-between">
              <span>HMAC SHA-1 Signature Flow</span>
              <span className="text-brand-indigo font-semibold">Security Verified</span>
            </div>
          </div>
        </div>
      </section>

      {/* Community Categories Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/5">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-10 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Explore Trending Communities</h2>
            <p className="text-sm text-dark-300">Discover groups tailored to your passion and discipline</p>
          </div>
          <Link
            to="/explore"
            className="text-xs font-semibold text-brand-blue hover:text-brand-indigo flex items-center gap-1"
          >
            <span>View All Categories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { name: 'Technology', count: '1.2k members', icon: '💻' },
            { name: 'Startups', count: '890 members', icon: '🚀' },
            { name: 'Gaming', count: '650 members', icon: '🎮' },
            { name: 'Education', count: '940 members', icon: '📚' },
            { name: 'Entertainment', count: '410 members', icon: '🎬' },
            { name: 'Sports', count: '320 members', icon: '⚡' },
          ].map((cat) => (
            <Link
              key={cat.name}
              to={`/explore?category=${cat.name}`}
              className="p-4 rounded-xl glass-card hover:border-brand-indigo/40 text-center transition-all group"
            >
              <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform">{cat.icon}</span>
              <h4 className="text-xs font-bold text-white mb-0.5">{cat.name}</h4>
              <span className="text-[10px] text-dark-400">{cat.count}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

