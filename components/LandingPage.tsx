
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Song } from '../types';
import { 
  Loader2, 
  Music, 
  Search, 
  Filter, 
  BookOpen, 
  Quote, 
  ListMusic, 
  Play, 
  Grid3X3, 
  Users, 
  ChevronRight,
  Hash,
  ArrowRight,
  Library
} from 'lucide-react';

interface LandingPageProps {
  onSelectSong: (songId: string) => void;
  onNavigate: (view: string, query?: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSelectSong, onNavigate }) => {
  const [recentSongs, setRecentSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [verse, setVerse] = useState({ 
    text: "For everyone born of God overcomes the world. This is the victory that has overcome the world, even our faith.", 
    reference: "1 John 5:4" 
  });
  const [loadingVerse, setLoadingVerse] = useState(true);

  useEffect(() => {
    fetchPublicSongs();
    fetchVerseOfTheDay();
  }, []);

  const fetchVerseOfTheDay = async () => {
    try {
      const response = await fetch('https://beta.ourmanna.com/api/v1/get/?format=json&order=daily');
      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      setVerse({
        text: data.verse.details.text,
        reference: data.verse.details.reference
      });
    } catch (error) {
      setVerse({ 
        text: "For everyone born of God overcomes the world. This is the victory that has overcome the world, even our faith.", 
        reference: "1 John 5:4" 
      });
    } finally {
      setLoadingVerse(false);
    }
  };

  const fetchPublicSongs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(6);

    if (!error && data) {
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

  const toolkit = [
    {
      id: 'search',
      title: 'Global Library',
      desc: 'Access 1000+ chord sheets. Search by artist, genre or tag.',
      icon: <Library className="text-cyan-500" size={24} />,
      action: () => onNavigate('search')
    },
    {
      id: 'setlists',
      title: 'Setlist Builder',
      desc: 'Plan your next gig. Drag and drop songs, sync keys with your band.',
      icon: <ListMusic className="text-purple-500" size={24} />,
      action: () => onNavigate('setlists')
    },
    {
      id: 'dictionary',
      title: 'Chord Dictionary',
      desc: 'Visual diagrams for Guitar, Ukulele and Piano. Master every voicing.',
      icon: <Grid3X3 className="text-orange-500" size={24} />,
      action: () => onNavigate('chord-dictionary')
    },
    {
      id: 'progressions',
      title: 'Creative Engine',
      desc: 'Proven harmonic formulas to kickstart your songwriting process.',
      icon: <BookOpen className="text-pink-500" size={24} />,
      action: () => onNavigate('progressions')
    },
    {
      id: 'groups',
      title: 'Band Hub',
      desc: 'Collaborate in real-time. Share arrangements and notes with your team.',
      icon: <Users className="text-emerald-500" size={24} />,
      action: () => onNavigate('groups')
    },
    {
      id: 'stage',
      title: 'Stage Mode',
      desc: 'Immersive view optimized for performance. No sleep, just music.',
      icon: <Play className="text-red-500" size={24} />,
      action: () => onNavigate('help')
    }
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onNavigate('search', searchTerm.trim());
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300">
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 px-6 overflow-hidden border-b border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 text-xs font-bold uppercase tracking-wider mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Hash size={12} /> Play together in one accord.
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black text-slate-900 dark:text-white mb-8 tracking-tighter animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            Serving your<br/><span className="bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">Worship.</span>
          </h1>
          
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-12 max-w-2xl mx-auto font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            Create professional song sheets, transpose instantly, and collaborate with your band in one unified digital stage.
          </p>
          
          <form onSubmit={handleSearchSubmit} className="relative max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <div className="relative group">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                <Search className="text-slate-400 group-focus-within:text-cyan-500 transition-colors" size={22} />
              </div>
              <input 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by artist or song title..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl py-5 pl-14 pr-6 text-lg focus:outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 transition-all shadow-xl dark:shadow-2xl dark:shadow-black/50 placeholder:text-slate-400"
              />
              <button 
                type="submit"
                className="absolute right-3 top-3 bottom-3 px-6 bg-slate-900 dark:bg-cyan-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 dark:hover:bg-cyan-500 transition-all active:scale-95"
              >
                Search <ArrowRight size={18} />
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Toolkit Grid */}
      <section className="py-24 px-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-xl">
            <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">The Musician's Toolkit</h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg">Every feature is designed by musicians, for musicians. Streamline your workflow from practice to stage.</p>
          </div>
          <button 
             onClick={() => onNavigate('help')}
             className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-bold hover:underline"
          >
            How it works <ChevronRight size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {toolkit.map((item, idx) => (
            <div 
              key={item.id}
              onClick={item.action}
              className="group relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-8 hover:border-cyan-500/50 hover:shadow-2xl hover:shadow-cyan-500/5 transition-all cursor-pointer overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                {item.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                {item.title}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                {item.desc}
              </p>
              <div className="flex items-center gap-2 text-sm font-black text-slate-400 group-hover:text-cyan-500 transition-colors uppercase tracking-widest">
                Launch <ArrowRight size={14} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Verse of the Day Banner */}
      <section className="py-20 px-6 bg-slate-900 dark:bg-slate-900 relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <Quote className="mx-auto text-cyan-500/20 mb-8" size={64} />
          {loadingVerse ? (
            <Loader2 className="animate-spin mx-auto text-cyan-500" />
          ) : (
            <>
              <p className="text-2xl md:text-3xl text-white font-serif italic mb-6 leading-relaxed">
                "{verse.text}"
              </p>
              <div className="h-px w-12 bg-cyan-500 mx-auto mb-4"></div>
              <p className="text-cyan-400 font-black uppercase tracking-[0.2em] text-sm">
                {verse.reference}
              </p>
            </>
          )}
        </div>
      </section>

      {/* Recent Activity / Community Feed */}
      <section className="py-24 px-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Recent Additions</h2>
          <button 
            onClick={() => onNavigate('search')}
            className="px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm"
          >
            View Entire Library
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={32} className="text-cyan-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentSongs.map(song => (
              <div 
                key={song.id}
                onClick={() => onSelectSong(song.id)}
                className="bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between min-h-[160px]"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors truncate pr-4">{song.title}</h3>
                    <span className="shrink-0 px-2 py-0.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-[10px] font-mono font-bold text-slate-400">
                      {song.key}
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-500 text-sm font-medium">{song.artist}</p>
                </div>
                
                <div className="flex flex-wrap gap-2 pt-4">
                  {song.genres?.slice(0, 2).map(g => (
                    <span key={g} className="text-[10px] px-2 py-1 bg-white dark:bg-slate-800 text-slate-400 rounded-md border border-slate-200 dark:border-slate-700 font-bold uppercase tracking-wider">
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer Branding */}
      <footer className="py-20 px-6 border-t border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/50 text-center">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center">
              <Music className="text-white" size={16} />
            </div>
            <span className="text-xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">Unison</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed">
            Elevating the standard of digital musicianship. <br/>Designed for the modern band leader and performer.
          </p>
          <div className="flex justify-center gap-6 text-slate-400">
            <button onClick={() => onNavigate('help')} className="hover:text-cyan-500 transition-colors text-xs font-bold uppercase tracking-widest">Documentation</button>
            <button className="hover:text-cyan-500 transition-colors text-xs font-bold uppercase tracking-widest">Privacy</button>
            <button className="hover:text-cyan-500 transition-colors text-xs font-bold uppercase tracking-widest">Terms</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
