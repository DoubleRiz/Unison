
import React from 'react';
import { Music, Search, LogIn, User, LogOut, CircleHelp } from 'lucide-react';

interface NavbarProps {
  session: any;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onNavigateHome: () => void;
  onNavigateProfile: () => void;
  onNavigateHelp: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ session, onOpenAuth, onSignOut, onNavigateHome, onNavigateProfile, onNavigateHelp }) => {
  return (
    <nav className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-2 cursor-pointer" onClick={onNavigateHome}>
        <div className="w-8 h-8 bg-cyan-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Music className="text-white" size={20} />
        </div>
        <span className="text-xl font-bold tracking-tight text-white">ChordCraft</span>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={onNavigateHelp}
          className="text-slate-400 hover:text-cyan-400 transition-colors"
          title="Help & Tutorials"
        >
          <CircleHelp size={24} />
        </button>

        <div className="h-6 w-px bg-slate-800 mx-1"></div>

        {session ? (
          <div className="flex items-center gap-4">
            <button 
              onClick={onNavigateProfile}
              className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                {session.user?.user_metadata?.avatar_url ? (
                  <img src={session.user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full rounded-full" />
                ) : (
                  <User size={16} className="text-cyan-400" />
                )}
              </div>
              <span className="text-sm font-medium hidden md:block">
                {session.user?.user_metadata?.full_name || 'Musician'}
              </span>
            </button>
            <button 
              onClick={onSignOut}
              className="p-2 text-slate-400 hover:text-white transition-colors"
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
