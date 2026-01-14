
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Song, GENRES } from '../types';
import { Search, Filter, Dices, Music, User, Tag, Loader2, ArrowUpAZ } from 'lucide-react';

interface AdvancedSearchProps {
  session?: any;
  initialQuery?: string;
  onSelectSong: (id: string) => void;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({ session, initialQuery = '', onSelectSong }) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchTitle, setSearchTitle] = useState(initialQuery);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedArtist, setSelectedArtist] = useState('');

  // Sync initialQuery if it changes while component is mounted
  useEffect(() => {
    if (initialQuery) setSearchTitle(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    fetchAllSongs();
  }, [session]);

  const fetchAllSongs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('songs')
        .select('*');

      if (session?.user?.id) {
        query = query.or(`is_public.eq.true,user_id.eq.${session.user.id}`);
      } else {
        query = query.eq('is_public', true);
      }
        
      const { data, error } = await query
        .order('title', { ascending: true })
        .limit(1000);

      if (error) throw error;

      if (data) {
        const mapped: Song[] = data.map((s: any) => ({
            id: s.id,
            user_id: s.user_id,
            title: s.title,
            artist: s.artist,
            bpm: s.bpm,
            key: s.original_key,
            content: s.content,
            youtubeUrl: s.youtube_url,
            audioUrl: s.audio_url,
            is_public: s.is_public,
            genres: s.genres || [],
            tags: s.tags || []
        }));
        setSongs(mapped);
      }
    } catch (err: any) {
      console.error("Error fetching library:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const uniqueArtists = useMemo(() => {
    const artists = new Set(songs.map(s => s.artist));
    return Array.from(artists).sort();
  }, [songs]);

  const uniqueTags = useMemo(() => {
    const tags = new Set<string>();
    songs.forEach(s => s.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [songs]);

  const filteredSongs = songs.filter(song => {
    const matchesTitle = song.title.toLowerCase().includes(searchTitle.toLowerCase());
    const matchesArtist = selectedArtist ? song.artist === selectedArtist : true;
    const matchesGenre = selectedGenre ? song.genres?.includes(selectedGenre) : true;
    const matchesTag = selectedTag ? song.tags?.includes(selectedTag) : true;

    return matchesTitle && matchesArtist && matchesGenre && matchesTag;
  });

  const handleRandomSong = () => {
    if (filteredSongs.length === 0) return;
    const randomIndex = Math.floor(Math.random() * filteredSongs.length);
    const randomSong = filteredSongs[randomIndex];
    onSelectSong(randomSong.id);
  };

  const clearFilters = () => {
    setSearchTitle('');
    setSelectedArtist('');
    setSelectedGenre('');
    setSelectedTag('');
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 p-6 animate-in fade-in duration-500">
      <div className="mb-8 border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Filter className="text-cyan-500" /> Advanced Library
          </h1>
          <p className="text-slate-400">Browse the entire collection alphabetically with precision filters.</p>
        </div>
        
        <button 
          onClick={handleRandomSong}
          disabled={filteredSongs.length === 0}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-bold shadow-lg shadow-purple-900/20 flex items-center gap-2 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Dices size={24} />
          Surprise Me!
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Title Search */}
          <div className="relative">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Title</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text"
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
                placeholder="Search title..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          {/* Artist Select */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Artist</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <select
                value={selectedArtist}
                onChange={(e) => setSelectedArtist(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-8 text-sm text-white focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer"
              >
                <option value="">All Artists</option>
                {uniqueArtists.map(artist => (
                  <option key={artist} value={artist}>{artist}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Genre Select */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Genre</label>
            <div className="relative">
              <Music className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-8 text-sm text-white focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer"
              >
                <option value="">All Genres</option>
                {GENRES.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tag Select */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Tag</label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-8 text-sm text-white focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer"
              >
                <option value="">All Tags</option>
                {uniqueTags.map(tag => (
                  <option key={tag} value={tag}>#{tag}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {(searchTitle || selectedArtist || selectedGenre || selectedTag) && (
           <div className="mt-4 flex justify-end">
             <button 
               onClick={clearFilters}
               className="text-xs text-red-400 hover:text-red-300 font-medium flex items-center gap-1"
             >
               Clear Filters
             </button>
           </div>
        )}
      </div>

      {/* Results */}
      <div>
        <div className="flex justify-between items-center mb-4">
           <h2 className="text-white font-bold flex items-center gap-2">
             <ArrowUpAZ size={20} className="text-slate-500" />
             Results <span className="text-slate-500 font-normal">({filteredSongs.length})</span>
           </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={40} className="text-cyan-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSongs.map(song => (
              <div 
                key={song.id}
                onClick={() => onSelectSong(song.id)}
                className="bg-slate-900 border border-slate-800 rounded-lg p-4 hover:border-cyan-500/50 hover:bg-slate-800 transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-2">
                   <h3 className="font-bold text-white group-hover:text-cyan-400 truncate pr-2">{song.title}</h3>
                   <span className="text-xs font-mono text-slate-500 border border-slate-800 px-1.5 py-0.5 rounded">{song.key}</span>
                </div>
                <div className="text-sm text-slate-400 mb-3">{song.artist}</div>
                
                <div className="flex flex-wrap gap-1.5">
                   {song.genres?.slice(0, 2).map(g => (
                     <span key={g} className="text-[10px] px-1.5 py-0.5 bg-slate-950 text-slate-500 rounded border border-slate-800">
                       {g}
                     </span>
                   ))}
                   {song.tags?.slice(0, 2).map(t => (
                     <span key={t} className="text-[10px] px-1.5 py-0.5 bg-purple-900/10 text-purple-400/70 rounded border border-purple-900/20">
                       #{t}
                     </span>
                   ))}
                </div>
              </div>
            ))}
            
            {filteredSongs.length === 0 && (
              <div className="col-span-full text-center py-10 bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
                <Music size={48} className="mx-auto text-slate-600 mb-3" />
                <p className="text-slate-400">No songs match your specific filters.</p>
                <button onClick={clearFilters} className="mt-2 text-cyan-400 hover:underline">Clear all filters</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedSearch;
