import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Compass,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  User,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Layers,
} from 'lucide-react';
import { NexconnBadge } from './NexconnBadge';
import { NotificationDropdown } from './NotificationDropdown';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Explore', path: '/explore', icon: Compass },
    { name: 'Messages', path: '/messages', icon: MessageSquare },
    { name: 'SphereAI', path: '/assistant', icon: Sparkles },
  ];

  if (user && ['admin', 'moderator'].includes(user.role)) {
    navLinks.push({ name: 'Moderation', path: '/admin', icon: ShieldCheck });
  }

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-white/10 bg-dark-950/80 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-blue via-brand-indigo to-brand-violet flex items-center justify-center shadow-lg shadow-brand-indigo/25 group-hover:shadow-brand-indigo/40 transition-all duration-300">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                ConnectSphere
              </span>
              <span className="text-[10px] font-semibold text-brand-blue tracking-widest uppercase -mt-1">
                Nexconn AI
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-1 bg-dark-900/60 p-1.5 rounded-2xl border border-white/5">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname.startsWith(link.path);
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-brand-indigo text-white shadow-md shadow-brand-indigo/30'
                        : 'text-dark-300 hover:text-white hover:bg-dark-800/80'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-dark-400'}`} />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Right Header: SDK Status, Notifications, User Menu */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <NexconnBadge />
            </div>

            {isAuthenticated ? (
              <>
                <NotificationDropdown />

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1 pl-2 rounded-full border border-white/10 hover:border-brand-indigo/40 transition-all bg-dark-900/80"
                  >
                    <span className="text-xs font-semibold text-dark-200 hidden sm:inline max-w-[100px] truncate">
                      {user?.name?.split(' ')[0]}
                    </span>
                    <img
                      src={user?.avatarUrl}
                      alt={user?.name}
                      className="w-7 h-7 rounded-full object-cover ring-2 ring-brand-indigo/30"
                    />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl glass-panel shadow-2xl p-2 border border-white/10 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 py-2 border-b border-white/5 mb-1">
                        <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                        <p className="text-[11px] text-dark-400 truncate">@{user?.username}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-brand-indigo/20 text-brand-indigo">
                          {user?.role}
                        </span>
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-dark-300 hover:text-white hover:bg-dark-800 transition-colors"
                      >
                        <User className="w-4 h-4 text-brand-blue" />
                        <span>Profile & SDK Status</span>
                      </Link>

                      {['admin', 'moderator'].includes(user?.role || '') && (
                        <Link
                          to="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-dark-300 hover:text-white hover:bg-dark-800 transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          <span>Admin Moderation</span>
                        </Link>
                      )}

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-dark-200 hover:text-white transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-brand-blue to-brand-indigo hover:from-brand-blue/90 hover:to-brand-indigo/90 shadow-md shadow-brand-indigo/30 transition-all"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            {isAuthenticated && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl text-dark-300 hover:text-white hover:bg-dark-800"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && isAuthenticated && (
        <div className="md:hidden border-t border-white/10 bg-dark-950/95 backdrop-blur-2xl px-4 pt-3 pb-5 space-y-1.5">
          <div className="pb-2 mb-2 border-b border-white/10 flex items-center justify-between">
            <NexconnBadge compact />
          </div>
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname.startsWith(link.path);
            return (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-indigo text-white shadow-md'
                    : 'text-dark-300 hover:text-white hover:bg-dark-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
};

