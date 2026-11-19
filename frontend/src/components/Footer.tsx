import React from 'react';
import { Layers, Github, ExternalLink, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/10 bg-dark-950/60 backdrop-blur-md mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-blue to-brand-violet flex items-center justify-center">
                <Layers className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg text-white">ConnectSphere</span>
            </div>
            <p className="text-sm text-dark-300 max-w-sm mb-4 leading-relaxed">
              AI-Powered Community Connect platform engineered for high-engagement collaboration, real-time messaging, and live discussion rooms powered by the Nexconn Chat SDK.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-indigo/10 border border-brand-indigo/20 text-brand-indigo">
              <span>Hackathon Track: Open Innovation</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Platform</h4>
            <ul className="space-y-2 text-sm text-dark-300">
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Key Capabilities
                </a>
              </li>
              <li>
                <a href="/explore" className="hover:text-white transition-colors">
                  Explore Communities
                </a>
              </li>
              <li>
                <a href="/assistant" className="hover:text-white transition-colors">
                  SphereAI Copilot
                </a>
              </li>
              <li>
                <a href="/admin" className="hover:text-white transition-colors">
                  Smart Moderation
                </a>
              </li>
            </ul>
          </div>

          {/* Technology */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Technologies</h4>
            <ul className="space-y-2 text-sm text-dark-300">
              <li>
                <a
                  href="https://docs.nexconn.ai/"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-brand-blue transition-colors flex items-center gap-1.5"
                >
                  <span>Nexconn Chat SDK</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <span className="text-dark-300">Google Gemini API</span>
              </li>
              <li>
                <span className="text-dark-300">React 19 & Vite 6</span>
              </li>
              <li>
                <span className="text-dark-300">Node.js, Express & MongoDB</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-dark-400 gap-4">
          <p>© 2026 ConnectSphere. Built for the Open Innovation Hackathon.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Smart AI Content Protected</span>
            </span>
            <span>•</span>
            <span className="text-dark-300">100% Nexconn SDK Powered</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

