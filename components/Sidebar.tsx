
import React, { useState } from 'react';
import { Song, Group } from '../types';
import { Music, Search, Heart, List, Users, User, LogOut, Plus, Filter, ShieldQuestion, X, Grid3X3, BookOpen } from 'lucide-react';

interface SidebarProps {
  session: any;
  songs: Song[];
  groups: Group[]; 
  pendingInvitesCount: number;
  currentSongId: string | null;
  currentView: string;
  isSidebarOpen: boolean;
  // New prop to close sidebar on mobile selection
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
      {/* Mobile Sidebar (Fixed Overlay) & Desktop Sidebar (Relative Flow) */}
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
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNavigation('landing')}>
                <div className="w-10 h-10 bg-cyan-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
                  <Music className="text-white" size={24} />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-white">ChordCraft</h1>
              </div>
              {/* Mobile Close Button */}
              <button onClick={onCloseMobile} className="md:hidden text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text"
                placeholder="Search quick list..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-sm text-slate-300 focus:outline-none focus:border-cyan-600 placeholder:text-slate-600"
              />
            </div>

            {/* Main Navigation Shortcuts */}
            <div className="flex flex-col gap-2 mb-2">
               <button 
                  onClick={() => handleNavigation('search')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors border ${currentView === 'search' ? 'bg-slate-800 text-white border-slate-700' : 'bg-blue-900/10 text-blue-400 border-blue-900/20 hover:bg-blue-900/20'}`}
                >
                   <Filter size={16} />
                   <span className="font-medium text-sm">Advanced Library (All)</span>
                </button>
            </div>

            <div className="flex gap-2">
               <button 
                 onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                 className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium border flex items-center justify-center gap-2 transition-colors ${showFavoritesOnly ? 'bg-pink-900/30 border-pink-500/50 text-pink-400' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}`}
               >
                 <Heart size={12} fill={showFavoritesOnly ? "currentColor" : "none"} />
                 Favs
               </button>
               <button 
                 onClick={() => handleNavigation('setlists')}
                 className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium border flex items-center justify-center gap-2 transition-colors ${currentView === 'setlists' ? 'bg-cyan-900/30 border-cyan-500/50 text-cyan-400' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}`}
               >
                 <List size={12} />
                 Setlists
               </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {filteredSongs.slice(0, 30).map(song => (
              <button
                key={song.id}
                onClick={() => handleSongSelect(song.id)}
                className={`w-full text-left p-3 rounded-lg transition-all duration-200 group relative ${
                  currentSongId === song.id && currentView === 'main'
                    ? 'bg-slate-800 border-l-4 border-cyan-500 shadow-md' 
                    : 'hover:bg-slate-800/50 border-l-4 border-transparent'
                }`}
              >
                <div className={`font-medium mb-1 pr-6 truncate ${currentSongId === song.id && currentView === 'main' ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                  {song.title}
                </div>
                <div className="text-xs text-slate-500 flex justify-between">
                  <span className="truncate max-w-[120px]">{song.artist}</span>
                  <span className="font-mono">{song.key}</span>
                </div>
                <div className="absolute top-3 right-2 flex flex-col gap-1 items-end">
                  {song.is_favorite && <Heart size={12} className="text-pink-500" fill="currentColor" />}
                  {song.shared_with_group_id && <Users size={12} className="text-purple-400" />}
                </div>
              </button>
            ))}
            {filteredSongs.length === 0 && (
              <div className="text-center text-slate-500 py-4 text-sm">No songs found.</div>
            )}
          </div>

          <div className="p-4 border-t border-slate-800 flex flex-col gap-2">
            
            {/* Tools Section */}
            <div className="mb-2 pb-2 border-b border-slate-800/50">
               <div className="text-[10px] uppercase font-bold text-slate-500 mb-1 px-2">Tools</div>
               <button 
                onClick={() => handleNavigation('chord-dictionary')}
                className={`w-full flex items-center gap-3 px-2 py-2 mb-1 rounded-lg transition-colors relative ${currentView === 'chord-dictionary' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50'}`}
              >
                <Grid3X3 size={16} />
                <span className="font-medium text-sm">Chord Dictionary</span>
              </button>
               <button 
                onClick={() => handleNavigation('progressions')}
                className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg transition-colors relative ${currentView === 'progressions' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50'}`}
              >
                <BookOpen size={16} />
                <span className="font-medium text-sm">Progressions</span>
              </button>
            </div>

            <button 
              onClick={() => handleNavigation('groups')}
              className={`flex items-center gap-3 px-2 py-3 mb-1 rounded-lg transition-colors relative ${currentView === 'groups' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50'}`}
            >
               <div className="w-8 h-8 rounded-full bg-purple-900/30 flex items-center justify-center text-purple-500 border border-slate-700">
                 <Users size={16} />
               </div>
               <span className="font-medium text-sm">Groups</span>
               {pendingInvitesCount > 0 && (
                 <div className="absolute right-2 top-3 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                   {pendingInvitesCount}
                 </div>
               )}
            </button>
            
             <button 
              onClick={() => handleNavigation('help')}
              className={`flex items-center gap-3 px-2 py-3 mb-1 rounded-lg transition-colors relative ${currentView === 'help' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50'}`}
            >
               <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-cyan-500 border border-slate-700">
                 <ShieldQuestion size={16} />
               </div>
               <span className="font-medium text-sm">Help & Tutorials</span>
            </button>

            <div className="flex items-center gap-2 border-t border-slate-800 pt-3 mt-1">
               <button 
                  onClick={() => handleNavigation('profile')}
                  className="flex-1 flex items-center gap-2 p-2 rounded-lg hover:bg-slate-800 transition-colors overflow-hidden"
               >
                 <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-cyan-500 border border-slate-700 flex-shrink-0">
                    {session.user.user_metadata.avatar_url ? (
                      <img src={session.user.user_metadata.avatar_url} className="w-full h-full object-cover"/>
                    ) : (
                      <User size={16} />
                    )}
                 </div>
                 <div className="text-xs text-left min-w-0">
                    <div className="text-slate-300 font-medium truncate">{session.user.user_metadata.full_name || 'User'}</div>
                 </div>
               </button>
               <button onClick={onSignOut} className="p-2 text-slate-500 hover:text-white"><LogOut size={18}/></button>
            </div>

            <button 
              onClick={() => { onCreateSong(); onCloseMobile(); }}
              className="w-full py-3 mt-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors border border-slate-700 hover:border-slate-600"
            >
              <Plus size={16} />
              Add New Song
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
