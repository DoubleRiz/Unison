
import React from 'react';
import { Song, Group } from '../types';
import { 
  Heart, 
  List, 
  Users, 
  User, 
  LogOut, 
  Plus, 
  Filter, 
  ShieldQuestion, 
  X, 
  Grid3X3, 
  BookOpen, 
  AudioWaveform, 
  Music,
  LayoutGrid,
  LogIn
} from 'lucide-react';

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
  // Added onOpenAuth property
  onOpenAuth: () => void;
  onCreateSong: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  session,
  pendingInvitesCount,
  currentView,
  isSidebarOpen,
  onCloseMobile,
  onNavigate,
  onSignOut,
  // Destructured onOpenAuth
  onOpenAuth,
  onCreateSong
}) => {
  const handleNavigation = (view: string) => {
    onNavigate(view);
    onCloseMobile();
  };

  // Rail mode if sidebar is logically "open" but screen is medium (tablet)
  // Or if we specifically implemented a toggle. Here we follow isSidebarOpen.
  
  return (
    <aside 
      className={`
        hidden md:flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 ease-in-out h-full
        ${isSidebarOpen ? 'w-72' : 'w-20'}
      `}
    >
      <div className="flex flex-col h-full w-full overflow-hidden">
        {/* Top Section: Action Button */}
        <div className="p-4 border-b border-slate-800">
          <button 
            onClick={() => onCreateSong()}
            className={`w-full py-3.5 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all shadow-lg shadow-cyan-950/50 border border-cyan-500/20 active:scale-95 ${!isSidebarOpen ? 'px-0' : ''}`}
          >
            <Plus size={20} />
            {isSidebarOpen && <span>Add New Song</span>}
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-hide">
          {isSidebarOpen && <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-2 px-2">Library</div>}
          
          <SidebarItem 
            icon={<LayoutGrid size={18} />} 
            label="Explore" 
            isActive={currentView === 'landing'} 
            isOpen={isSidebarOpen} 
            onClick={() => handleNavigation('landing')} 
          />

          <SidebarItem 
            icon={<Filter size={18} />} 
            label="Library" 
            isActive={currentView === 'search'} 
            isOpen={isSidebarOpen} 
            onClick={() => handleNavigation('search')} 
          />

          <SidebarItem 
            icon={<List size={18} />} 
            label="Setlists" 
            isActive={currentView === 'setlists'} 
            isOpen={isSidebarOpen} 
            onClick={() => handleNavigation('setlists')} 
          />

          <div className="pt-6 pb-2">
            {isSidebarOpen && <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-2 px-2">Tools</div>}
            <SidebarItem 
              icon={<Grid3X3 size={18} />} 
              label="Chords" 
              isActive={currentView === 'chord-dictionary'} 
              isOpen={isSidebarOpen} 
              onClick={() => handleNavigation('chord-dictionary')} 
            />
            <SidebarItem 
              icon={<BookOpen size={18} />} 
              label="Progressions" 
              isActive={currentView === 'progressions'} 
              isOpen={isSidebarOpen} 
              onClick={() => handleNavigation('progressions')} 
            />
          </div>

          <div className="pt-6 pb-2">
            {isSidebarOpen && <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-2 px-2">Team</div>}
            <button 
              onClick={() => handleNavigation('groups')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all font-bold ${currentView === 'groups' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'} ${!isSidebarOpen ? 'justify-center' : ''}`}
            >
              <div className="flex items-center gap-3">
                <Users size={18} />
                {isSidebarOpen && <span className="text-sm">Band Hub</span>}
              </div>
              {isSidebarOpen && pendingInvitesCount > 0 && (
                <div className="bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black">
                  {pendingInvitesCount}
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          {session ? (
            <div className={`flex items-center gap-2 ${!isSidebarOpen ? 'flex-col' : ''}`}>
              <button 
                  onClick={() => handleNavigation('profile')}
                  className={`flex-1 flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800 transition-all overflow-hidden ${!isSidebarOpen ? 'justify-center' : ''}`}
              >
                <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-cyan-500 border border-slate-700 flex-shrink-0 shadow-inner">
                    {session.user?.user_metadata?.avatar_url ? (
                      <img src={session.user.user_metadata.avatar_url} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <User size={18} />
                    )}
                </div>
                {isSidebarOpen && (
                  <div className="text-left min-w-0">
                      <div className="text-slate-200 font-bold text-sm truncate">{session.user?.user_metadata?.full_name || 'User'}</div>
                      <div className="text-[10px] text-slate-500 uppercase font-black">Member</div>
                  </div>
                )}
              </button>
              <button onClick={onSignOut} className="p-2 text-slate-500 hover:text-red-400 transition-colors" title="Sign Out">
                <LogOut size={18}/>
              </button>
            </div>
          ) : (
            <button 
              // Updated to use onOpenAuth directly
              onClick={onOpenAuth}
              className={`w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${!isSidebarOpen ? 'px-0' : ''}`}
            >
              <LogIn size={18} />
              {isSidebarOpen && <span>Sign In</span>}
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isOpen: boolean;
  onClick: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, isActive, isOpen, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-bold text-sm ${isActive ? 'bg-slate-800 text-white shadow-lg border-l-2 border-cyan-500' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'} ${!isOpen ? 'justify-center' : ''}`}
  >
    <div className="shrink-0">{icon}</div>
    {isOpen && <span className="truncate">{label}</span>}
  </button>
);

export default Sidebar;
