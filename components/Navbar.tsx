
import React, { useState, useRef, useEffect } from 'react';
import { LogIn, User, Search, Dices, ListMusic, Sun, Moon, AudioWaveform, Music, Menu } from 'lucide-react';
import { Song } from '../types';

interface NavbarProps {
  session: any;
  songs: Song[];
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onNavigateHome: () => void;
  onNavigateProfile: () => void;
  onNavigateSetlists: () => void;
  onRandomSong: () => void;
  onSelectSong: (id: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ 
  session, 
  songs,
  theme,
  toggleTheme,
  onOpenAuth, 
  onNavigateHome, 
  onNavigateProfile, 
  onNavigateSetlists,
  onRandomSong,
  onSelectSong
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const suggestions = searchQuery.trim().length > 0
    ? songs.filter(s => 
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.artist.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 6)
    : [];

  const handleSelect = (id: string) => {
    onSelectSong(id);
    setSearchQuery('');
    setShowSuggestions(false);
  };

  return (
    <nav className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-50 transition-colors duration-300">
      {/* Logo Area */}
      <div className="flex items-center gap-3 cursor-pointer group shrink-0" onClick={onNavigateHome}>
        <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-cyan-600 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all transform group-hover:scale-105">
          <AudioWaveform className="text-white" size={20} />
        </div>
        <span className="text-xl md:text-2xl font-black tracking-tighter bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent hidden sm:block">
          UNISON
        </span>
      </div>

      {/* Global Search & Random */}
      <div className="flex-1 max-w-sm md:max-w-xl mx-2 md:mx-8 flex items-center gap-2 relative" ref={searchRef}>
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-500 transition-colors" size={14} />
          <input 
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-cyan-500/50 focus:bg-white dark:focus:bg-slate-950 rounded-full py-2 pl-9 md:pl-10 pr-4 text-xs md:text-sm text-slate-900 dark:text-white transition-all outline-none"
          />

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="py-2">
                {suggestions.map(song => (
                  <button
                    key={song.id}
                    onClick={() => handleSelect(song.id)}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left group"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400">{song.title}</div>
                      <div className="text-[10px] text-slate-500 truncate italic">by {song.artist}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <button 
          onClick={onRandomSong}
          className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-full transition-all border border-transparent shadow-sm active:scale-95"
          title="Surprise Me"
        >
          <Dices size={18} />
        </button>
      </div>

      {/* Actions & Profile */}
      <div className="flex items-center gap-1 md:gap-3 shrink-0">
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-400 hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {!session && (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs md:text-sm font-bold shadow-lg active:scale-95"
          >
            <LogIn size={16} />
            <span className="hidden md:inline">Sign In</span>
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
