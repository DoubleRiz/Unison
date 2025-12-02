import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Song } from '../types';
import { Loader2, Music, Search, Heart, User, Filter } from 'lucide-react';

interface LandingPageProps {
  onSelectSong: (songId: string) => void;
  onNavigateToAdvancedSearch?: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSelectSong, onNavigateToAdvancedSearch }) => {
  const [recentSongs, setRecentSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPublicSongs();
  }, []);

  const fetchPublicSongs = async () => {
    setLoading(true);
    // Fetch public songs, limiting to 20 most recent
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(24);

    if (!error && data) {
      // Basic mapping
      const mapped: Song[] = data.map((s: any) => ({
        id: s.id,
        user_id: s.user_id,
        title: s.title,
        artist: s.artist,
        bpm: s.bpm,
        key: s.original_key,
        content: s.content,
        is_public: s.is_public,
        genres: s.genres || [],
        tags: s.tags || []
      }));
      setRecentSongs(mapped);
    }
    setLoading(false);
  };

  const filteredSongs = recentSongs.filter(s => 
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex flex-col min-h-screen bg-slate-950">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 py-20 px-6 border-b border-slate-800">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            Share your <span className="text-cyan-400">chords</span>.<br/>
            Play with the world.
          </h1>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            The collaborative platform for musicians. Create professional song sheets, transpose instantly, and build setlists with your band.
          </p>
          
          <div className="relative max-w-xl mx-auto space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="text-slate-500" size={20} />
              </div>
              <input 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search for a song, artist, or tag..."
                className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-full py-4 pl-12 pr-6 text-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all placeholder:text-slate-600"
              />
            </div>
            
            {onNavigateToAdvancedSearch && (
              <button 
                onClick={onNavigateToAdvancedSearch}
                className="text-slate-400 hover:text-cyan-400 text-sm font-medium flex items-center justify-center gap-2 mx-auto transition-colors"
              >
                <Filter size={16} />
                Advanced Search & Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12 w-full">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Music className="text-cyan-500" />
            {searchTerm ? 'Search Results' : 'Recently Added'}
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={40} className="text-cyan-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSongs.map(song => (
              <div 
                key={song.id}
                onClick={() => onSelectSong(song.id)}
                className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-cyan-500/50 hover:bg-slate-800/80 transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-1">{song.title}</h3>
                    <p className="text-slate-400 text-sm">{song.artist}</p>
                  </div>
                  <span className="px-2 py-1 bg-slate-950 rounded text-xs font-mono font-bold text-slate-500 border border-slate-800">
                    {song.key}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-4">
                  {song.genres?.slice(0, 3).map(g => (
                    <span key={g} className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full border border-slate-700">
                      {g}
                    </span>
                  ))}
                  {song.tags?.slice(0, 2).map(t => (
                    <span key={t} className="text-[10px] px-2 py-0.5 bg-purple-900/20 text-purple-400 rounded-full border border-purple-900/30">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {!loading && filteredSongs.length === 0 && (
          <div className="text-center py-20 text-slate-500">
            No public songs found matching your search.
          </div>
        )}
      </div>
    </div>
  );
};

export default LandingPage;