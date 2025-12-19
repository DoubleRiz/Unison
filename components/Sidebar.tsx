
import React, { useState } from 'react';
import { Song, Group } from '../types';
import { Search, Heart, List, Users, User, LogOut, Plus, Filter, ShieldQuestion, X, Grid3X3, BookOpen, AudioWaveform } from 'lucide-react';

interface SidebarProps {
  session: any;
  songs: Song[];
  groups: Group[]; 
  pendingInvitesCount: number;
  currentSongId: string | null;
  currentView: string;
  isSidebarOpen: boolean;
  onCloseMobile: () => void;
  onNavigate: (view: any) => void;
  onSelectSong: (id: string) => void;
  onSignOut: () => void;
  onCreateSong: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  session,
  songs,
  pendingInvitesCount,
  currentSongId,
  currentView,
  isSidebarOpen,
  onCloseMobile,
  onNavigate,
  onSelectSong,
  onSignOut,
  onCreateSong
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const filteredSongs = songs.filter(s => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = s.title.toLowerCase().includes(q) ||
                          s.artist.toLowerCase().includes(q) ||
                          s.tags?.some(t => t.toLowerCase().includes(q));
    const matchesFav = showFavoritesOnly ? s.is_favorite : true;
    return matchesSearch && matchesFav;
  });

  const handleNavigation = (view: string) => {
    onNavigate(view);
    onCloseMobile();
  };

  const handleSongSelect = (id: string) => {
    onSelectSong(id);
    onCloseMobile();
  };

  return (
    <>
      <aside 
        className={`
          fixed inset-y-0 left-0 z-40 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:w-0 md:border-r-0 md:overflow-hidden'}
          w-80 h-full
        `}
      >
        <div className="flex flex-col h-full w-80">
          <div className="p-4 md:p-6 border-b border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3 cursor-pointer group" onClick={() => handleNavigation('landing')}>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all duration-300">
                  <AudioWaveform className="text-white" size={22} />
                </div>
                <h1 className="text-2xl font-black tracking-tighter text-white">UNISON</h1>
              </div>
              <button onClick={onCloseMobile} className="md:hidden text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text"
                placeholder="Search library..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-300 focus:outline-none focus:border-cyan-600 placeholder:text-slate-600"
              />
            </div>

            <div className="flex flex-col gap-2 mb-2">
               <button 
                  onClick={() => handleNavigation('search')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all border font-bold text-sm ${currentView === 'search' ? 'bg-slate-800 text-white border-slate-700 shadow-lg shadow-black/20' : 'bg-blue-900/10 text-blue-400 border-blue-900/20 hover:bg-blue-900/20'}`}
                >
                   <Filter size={18} />
                   <span>Explore Everything</span>
                </button>
            </div>

            <div className="flex gap-2">
               <button 
                 onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                 className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all ${showFavoritesOnly ? 'bg-pink-900/30 border-pink-500/50 text-pink-400 shadow-inner' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}`}
               >
                 <Heart size={14} fill={showFavoritesOnly ? "currentColor" : "none"} />
                 Favorites
               </button>
               <button 
                 onClick={() => handleNavigation('setlists')}
                 className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all ${currentView === 'setlists' ? 'bg-cyan-900/30 border-cyan-500/50 text-cyan-400 shadow-inner' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}`}
               >
                 <List size={14} />
                 Setlists
               </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {filteredSongs.slice(0, 50).map(song => (
              <button
                key={song.id}
                onClick={() => handleSongSelect(song.id)}
                className={`w-full text-left p-3 rounded-xl transition-all duration-200 group relative ${
                  currentSongId === song.id && currentView === 'main'
                    ? 'bg-slate-800 border-l-4 border-cyan-500 shadow-lg shadow-black/20' 
                    : 'hover:bg-slate-800/50 border-l-4 border-transparent'
                }`}
              >
                <div className={`font-bold mb-1 pr-6 truncate ${currentSongId === song.id && currentView === 'main' ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                  {song.title}
                </div>
                <div className="text-xs text-slate-500 flex justify-between font-medium">
                  <span className="truncate max-w-[120px]">{song.artist}</span>
                  <span className="font-mono text-slate-400">{song.key}</span>
                </div>
                <div className="absolute top-4 right-3 flex flex-col gap-1 items-end">
                  {song.is_favorite && <Heart size={12} className="text-pink-500" fill="currentColor" />}
                  {song.shared_with_group_id && <Users size={12} className="text-purple-400" />}
                </div>
              </button>
            ))}
          </div>

          <div className="p-4 border-t border-slate-800 flex flex-col gap-2 bg-slate-950/50">
            <div className="mb-2 pb-2 border-b border-slate-800/50">
               <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-2 px-2">Workspace</div>
               <button 
                onClick={() => handleNavigation('chord-dictionary')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 mb-1 rounded-xl transition-colors relative font-bold ${currentView === 'chord-dictionary' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800/50'}`}
              >
                <Grid3X3 size={18} />
                <span className="text-sm">Chord Dictionary</span>
              </button>
               <button 
                onClick={() => handleNavigation('progressions')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors relative font-bold ${currentView === 'progressions' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800/50'}`}
              >
                <BookOpen size={18} />
                <span className="text-sm">Progressions</span>
              </button>
            </div>

            <button 
              onClick={() => handleNavigation('groups')}
              className={`flex items-center gap-3 px-3 py-3 mb-1 rounded-xl transition-all relative font-bold ${currentView === 'groups' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50'}`}
            >
               <div className="w-8 h-8 rounded-lg bg-purple-900/30 flex items-center justify-center text-purple-400 border border-purple-800/50">
                 <Users size={18} />
               </div>
               <span className="text-sm">Band Groups</span>
               {pendingInvitesCount > 0 && (
                 <div className="absolute right-3 top-4 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black animate-bounce">
                   {pendingInvitesCount}
                 </div>
               )}
            </button>
            
            <div className="flex items-center gap-2 border-t border-slate-800 pt-4 mt-1">
               <button 
                  onClick={() => handleNavigation('profile')}
                  className="flex-1 flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800 transition-all overflow-hidden"
               >
                 <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-cyan-500 border border-slate-700 flex-shrink-0 shadow-inner">
                    {session.user.user_metadata.avatar_url ? (
                      <img src={session.user.user_metadata.avatar_url} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <User size={18} />
                    )}
                 </div>
                 <div className="text-left min-w-0">
                    <div className="text-slate-200 font-bold text-sm truncate">{session.user.user_metadata.full_name || 'User'}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-black">Account Settings</div>
                 </div>
               </button>
               <button onClick={onSignOut} className="p-2 text-slate-500 hover:text-red-400 transition-colors"><LogOut size={20}/></button>
            </div>

            <button 
              onClick={() => { onCreateSong(); onCloseMobile(); }}
              className="w-full py-3.5 mt-2 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all shadow-lg shadow-cyan-950/50 border border-cyan-500/20 active:scale-95"
            >
              <Plus size={18} />
              Add New Song
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
