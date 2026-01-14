
import React from 'react';
import { LayoutGrid, Library, ListMusic, Music2, User, HelpCircle } from 'lucide-react';

interface BottomNavProps {
  currentView: string;
  onNavigate: (view: any) => void;
  pendingInvitesCount: number;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentView, onNavigate, pendingInvitesCount }) => {
  const navItems = [
    { id: 'landing', label: 'Home', icon: <LayoutGrid size={22} /> },
    { id: 'search', label: 'Library', icon: <Library size={22} /> },
    { id: 'setlists', label: 'Sets', icon: <ListMusic size={22} /> },
    { id: 'chord-dictionary', label: 'Chords', icon: <Music2 size={22} /> },
    { id: 'profile', label: 'Me', icon: <User size={22} /> },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pointer-events-none">
      <nav className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 shadow-2xl rounded-2xl flex items-center justify-around p-2 pointer-events-auto">
        {navItems.map((item) => {
          const isActive = currentView === item.id || (item.id === 'profile' && currentView === 'profile');
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all duration-300 relative ${
                isActive 
                  ? 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/30' 
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <div className={`transition-transform duration-300 ${isActive ? 'scale-110 -translate-y-0.5' : ''}`}>
                {item.icon}
              </div>
              <span className={`text-[10px] font-bold mt-0.5 transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                {item.label}
              </span>
              
              {item.id === 'setlists' && pendingInvitesCount > 0 && (
                <div className="absolute top-1 right-4 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></div>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNav;
