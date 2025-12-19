
import React from 'react';
import { LogIn, User, LogOut, CircleHelp, Grid3X3, BookOpen, Sun, Moon, AudioWaveform } from 'lucide-react';

interface NavbarProps {
  session: any;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onNavigateHome: () => void;
  onNavigateProfile: () => void;
  onNavigateHelp: () => void;
  onNavigateDictionary: () => void;
  onNavigateProgressions: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ 
  session, 
  theme,
  toggleTheme,
  onOpenAuth, 
  onSignOut, 
  onNavigateHome, 
  onNavigateProfile, 
  onNavigateHelp,
  onNavigateDictionary,
  onNavigateProgressions
}) => {
  return (
    <nav className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-30 transition-colors duration-300">
      <div className="flex items-center gap-3 cursor-pointer group" onClick={onNavigateHome}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-cyan-600 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all duration-300 transform group-hover:scale-105 group-hover:rotate-3">
          <AudioWaveform className="text-white" size={22} />
        </div>
        <span className="text-2xl font-black tracking-tighter bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
          UNISON
        </span>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="hidden md:flex items-center gap-1 mr-2">
           <button 
            onClick={onNavigateDictionary}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Grid3X3 size={16} />
            <span>Chords</span>
          </button>
          <button 
            onClick={onNavigateProgressions}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <BookOpen size={16} />
            <span>Progressions</span>
          </button>
        </div>

        <button 
          onClick={onNavigateHelp}
          className="text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors p-2"
          title="Help & Tutorials"
        >
          <CircleHelp size={22} />
        </button>

        <button
          onClick={toggleTheme}
          className="p-2 text-slate-400 hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors"
          title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
        </button>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>

        {session ? (
          <div className="flex items-center gap-4">
            <button 
              onClick={onNavigateProfile}
              className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-white transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center border border-slate-300 dark:border-slate-700 overflow-hidden shadow-sm">
                {session.user?.user_metadata?.avatar_url ? (
                  <img src={session.user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={18} className="text-cyan-600 dark:text-cyan-400" />
                )}
              </div>
              <span className="text-sm font-bold hidden md:block">
                {session.user?.user_metadata?.full_name || 'Musician'}
              </span>
            </button>
            <button 
              onClick={onSignOut}
              className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              title="Sign Out"
            >
              <LogOut size={20} />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-cyan-900/20 active:scale-95"
          >
            <LogIn size={18} />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
