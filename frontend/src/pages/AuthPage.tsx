import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layers, ArrowRight, Zap, Shield, Sparkles } from 'lucide-react';

export const AuthPage: React.FC<{ initialMode?: 'login' | 'register' }> = ({ initialMode = 'login' }) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Form states
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState<string[]>(['Technology', 'AI']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const interestOptions = ['Technology', 'AI', 'Startups', 'Gaming', 'Education', 'Design', 'WebDev'];

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleDemoFill = (demoEmail: string) => {
    setIsLogin(true);
    setEmailOrUsername(demoEmail);
    setPassword('password123');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isLogin) {
        await login(emailOrUsername, password);
      } else {
        await register({
          name,
          username,
          email,
          password,
          bio,
          interests,
        });
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 relative">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-indigo/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-blue to-brand-violet flex items-center justify-center shadow-lg shadow-brand-indigo/30">
              <Layers className="w-5 h-5 text-white" />
            </div>
          </Link>
          <h2 className="text-2xl font-extrabold text-white">
            {isLogin ? 'Welcome Back to ConnectSphere' : 'Create Your Account'}
          </h2>
          <p className="text-xs text-dark-300 mt-1">
            Real-time chat powered by Nexconn Web SDK & AI Community Engine
          </p>
        </div>

        {/* Card */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/10">
          {/* Mode Switch Tabs */}
          <div className="flex bg-dark-900/80 p-1 rounded-xl mb-6 border border-white/5">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setError(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                isLogin
                  ? 'bg-brand-indigo text-white shadow-md'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setError(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                !isLogin
                  ? 'bg-brand-indigo text-white shadow-md'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Quick Demo Pre-fills for testing */}
          {isLogin && (
            <div className="mb-6 p-3 rounded-2xl bg-dark-900 border border-brand-indigo/20">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-blue mb-2">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Instant Hackathon Test Accounts:</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleDemoFill('alex@connectsphere.dev')}
                  className="py-1 px-2 rounded-lg bg-dark-800 hover:bg-brand-indigo/30 text-[11px] font-medium text-white border border-white/5 transition-all text-center"
                >
                  Alex (Admin)
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoFill('sarah@connectsphere.dev')}
                  className="py-1 px-2 rounded-lg bg-dark-800 hover:bg-brand-indigo/30 text-[11px] font-medium text-white border border-white/5 transition-all text-center"
                >
                  Sarah (AI)
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoFill('marcus@connectsphere.dev')}
                  className="py-1 px-2 rounded-lg bg-dark-800 hover:bg-brand-indigo/30 text-[11px] font-medium text-white border border-white/5 transition-all text-center"
                >
                  Marcus (SaaS)
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isLogin ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5">
                    Email or Username
                  </label>
                  <input
                    type="text"
                    required
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    placeholder="alex@connectsphere.dev or alex_lead"
                    className="w-full py-2.5 px-3.5 rounded-xl glass-input text-sm"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-dark-300">
                      Password
                    </label>
                    <span className="text-[11px] text-dark-400">Demo: password123</span>
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full py-2.5 px-3.5 rounded-xl glass-input text-sm"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-dark-300 mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Alex Rivera"
                      className="w-full py-2 px-3 rounded-xl glass-input text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-dark-300 mb-1.5">
                      Username *
                    </label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="alex_dev"
                      className="w-full py-2 px-3 rounded-xl glass-input text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className="w-full py-2 px-3.5 rounded-xl glass-input text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full py-2 px-3.5 rounded-xl glass-input text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5">
                    Short Bio (Optional)
                  </label>
                  <input
                    type="text"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Frontend engineer building real-time apps"
                    className="w-full py-2 px-3.5 rounded-xl glass-input text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5">
                    Select Your Interests
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {interestOptions.map((item) => {
                      const active = interests.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleInterest(item)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                            active
                              ? 'bg-brand-indigo text-white shadow-sm'
                              : 'bg-dark-800 text-dark-400 hover:text-white'
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-brand-blue to-brand-indigo hover:from-brand-blue/90 hover:to-brand-indigo/90 shadow-lg shadow-brand-indigo/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{isLoading ? 'Authenticating...' : isLogin ? 'Sign In' : 'Create Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

