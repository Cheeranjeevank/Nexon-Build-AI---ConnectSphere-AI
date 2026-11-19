import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { communityApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Users,
  Compass,
  Plus,
  ArrowRight,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { CreateCommunityModal } from '../components/CreateCommunityModal';

const CATEGORIES = [
  'All',
  'Technology',
  'Startups',
  'Gaming',
  'Education',
  'Entertainment',
  'Sports',
  'General discussions',
];

export const ExplorePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const [communities, setCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      const res = await communityApi.getCommunities({
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        search: searchQuery || undefined,
        limit: 30,
      });

      if (res.data?.communities) {
        setCommunities(res.data.communities);
      }
    } catch (err) {
      console.warn('Explore fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunities();
  }, [selectedCategory, searchQuery]);

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    if (cat === 'All') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', cat);
    }
    setSearchParams(searchParams);
  };

  const handleJoin = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setJoiningId(id);
      await communityApi.joinCommunity(id);
      setCommunities((prev) =>
        prev.map((c) =>
          c._id === id ? { ...c, membersCount: (c.membersCount || 0) + 1 } : c
        )
      );
    } catch (err) {
      console.warn(err);
    } finally {
      setJoiningId(null);
    }
  };

  const userJoinedIds = (user?.joinedCommunities || []).map((c: any) =>
    typeof c === 'string' ? c : c._id
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Compass className="w-6 h-6 text-brand-blue" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Explore Communities
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-dark-300">
            Find topic-based groups, collaborate with peers, and participate in live Nexconn discussion rooms.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-brand-indigo hover:bg-brand-purple transition-all flex items-center gap-2 self-start md:self-auto shadow-md shadow-brand-indigo/25"
        >
          <Plus className="w-4 h-4" />
          <span>Create Community</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="w-5 h-5 text-dark-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search communities by title, keyword, or tags (e.g. LLMs, React, Unreal)..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl glass-input text-sm text-white placeholder-dark-400"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <Filter className="w-4 h-4 text-dark-400 flex-shrink-0 mr-1" />
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => handleCategorySelect(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  active
                    ? 'bg-brand-indigo text-white shadow-md shadow-brand-indigo/30'
                    : 'bg-dark-900/80 text-dark-300 hover:text-white hover:bg-dark-800 border border-white/5'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Community Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-card p-6 rounded-2xl h-64 animate-pulse" />
          ))}
        </div>
      ) : communities.length === 0 ? (
        <div className="glass-card p-12 rounded-3xl text-center border-dashed border-white/10 max-w-lg mx-auto">
          <Compass className="w-12 h-12 text-dark-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No communities found</h3>
          <p className="text-xs text-dark-300 mb-6">
            Try adjusting your search query or be the first to create a community in this category!
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-indigo text-white hover:bg-brand-purple transition-all inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create "{selectedCategory}" Community</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {communities.map((comm) => {
            const isJoined = userJoinedIds.includes(comm._id);
            return (
              <div
                key={comm._id}
                className="glass-card rounded-2xl overflow-hidden transition-all duration-300 group flex flex-col justify-between"
              >
                <div>
                  {/* Banner */}
                  <div className="h-28 w-full relative overflow-hidden bg-dark-900">
                    <img
                      src={comm.bannerUrl}
                      alt={comm.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/40 to-transparent" />
                    <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-dark-950/80 backdrop-blur-md text-brand-blue border border-white/10 uppercase tracking-wider">
                      {comm.category}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="p-5 pt-0 relative">
                    <img
                      src={comm.avatarUrl}
                      alt={comm.name}
                      className="w-14 h-14 rounded-2xl object-cover ring-4 ring-dark-950 shadow-xl -mt-7 mb-3 relative z-10"
                    />

                    <h3 className="text-base font-bold text-white group-hover:text-brand-blue transition-colors line-clamp-1 mb-1">
                      {comm.name}
                    </h3>
                    <p className="text-xs text-dark-300 line-clamp-2 leading-relaxed mb-4">
                      {comm.description}
                    </p>

                    {/* Tags */}
                    {comm.tags && comm.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {comm.tags.slice(0, 3).map((tag: string) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-md text-[10px] bg-dark-900 text-dark-300 border border-white/5"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="p-5 pt-3 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-dark-400">
                    <Users className="w-3.5 h-3.5" />
                    <span>{comm.membersCount || 1} members</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isJoined ? (
                      <Link
                        to={`/community/${comm.slug}`}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-brand-indigo text-white hover:bg-brand-purple transition-all flex items-center gap-1 shadow-sm"
                      >
                        <span>Open</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <button
                        onClick={(e) => handleJoin(e, comm._id)}
                        disabled={joiningId === comm._id}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-brand-indigo hover:text-white text-dark-200 transition-all flex items-center gap-1 disabled:opacity-50"
                      >
                        <span>{joiningId === comm._id ? 'Joining...' : 'Join'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Community Modal */}
      <CreateCommunityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={() => fetchCommunities()}
      />
    </div>
  );
};

