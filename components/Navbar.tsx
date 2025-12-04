import React from 'react';
import { Music, LogIn, User, LogOut, CircleHelp, Grid3X3, BookOpen, Sun, Moon } from 'lucide-react';

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
      <div className="flex items-center gap-2 cursor-pointer" onClick={onNavigateHome}>
        <div className="w-8 h-8 bg-cyan-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Music className="text-white" size={20} />
        </div>
        <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">ChordCraft</span>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Public Tools Links */}
        <div className="hidden md:flex items-center gap-1 mr-2">
           <button 
            onClick={onNavigateDictionary}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Grid3X3 size={16} />
            <span>Chords</span>
          </button>
          <button 
            onClick={onNavigateProgressions}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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

        {/* Theme Toggle */}
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
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center border border-slate-300 dark:border-slate-700">
                {session.user?.user_metadata?.avatar_url ? (
                  <img src={session.user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full rounded-full" />
                ) : (
                  <User size={16} className="text-cyan-600 dark:text-cyan-400" />
                )}
              </div>
              <span className="text-sm font-medium hidden md:block">
                {session.user?.user_metadata?.full_name || 'Musician'}
              </span>
            </button>
            <button 
              onClick={onSignOut}
              className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-white transition-colors"
              title="Sign Out"
            >
              <LogOut size={20} />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-cyan-900/20"
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