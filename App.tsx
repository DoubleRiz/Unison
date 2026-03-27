
import React, { useState, useEffect, useMemo } from 'react';
import { Song, NotationMode } from './types';
import { supabase } from './lib/supabaseClient';
import { useAppData } from './hooks/useAppData';
import Sidebar from './components/Sidebar';
import SongSheet from './components/SongSheet';
import SongEditor from './components/SongEditor';
import Auth from './components/Auth';
import Profile from './components/Profile';
import SetlistEditor from './components/SetlistEditor';
import GroupManager from './components/GroupManager';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import AdvancedSearch from './components/AdvancedSearch';
import HelpPage from './components/HelpPage';
import ChordDictionary from './components/tools/ChordDictionary';
import ChordProgressions from './components/tools/ChordProgressions';
import BottomNav from './components/BottomNav';
import { 
  Minus, 
  Plus, 
  Hash, 
  Type, 
  Loader2, 
  PanelLeft, 
  ListMusic,
  Lock,
  ArrowRight,
  Download,
  X,
  Smartphone
} from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') as 'light' | 'dark' || 'dark';
    }
    return 'dark';
  });
  
  // Navigation & UI State
  const [currentSongId, setCurrentSongId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'landing' | 'main' | 'editor' | 'profile' | 'setlists' | 'groups' | 'search' | 'help' | 'chord-dictionary' | 'progressions'>('landing'); 
  const [initialSearchQuery, setInitialSearchQuery] = useState('');
  const [transpose, setTranspose] = useState(0);
  const [notationMode, setNotationMode] = useState<NotationMode>(NotationMode.LETTERS);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Responsive State
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Apply Theme Effect
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // PWA Install & Environment Check
  useEffect(() => {
    // Check if already in standalone mode (installed)
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsAppInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!sessionStorage.getItem('pwa_banner_dismissed') && !isAppInstalled) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => {
      setIsAppInstalled(true);
      setShowInstallBanner(false);
    });

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, [isAppInstalled]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowInstallBanner(false);
      }
    } else {
      // Fallback for iOS or Android browsers that don't support beforeinstallprompt
      alert("Pour installer l'app : \n1. Appuyez sur les 3 points (Android) ou Partager (iOS)\n2. Sélectionnez 'Ajouter à l'écran d'accueil'");
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setShowAuthModal(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const { 
    songs, 
    setSongs, 
    groups, 
    pendingInvitesCount, 
    loading, 
    publicSongData, 
    isAdmin 
  } = useAppData(session, currentView, currentSongId);

  const handleToggleFavorite = async (songId: string, isFav: boolean) => {
    if (!session) return;
    setSongs(prev => prev.map(s => s.id === songId ? { ...s, is_favorite: isFav } : s));
    if (isFav) {
      await supabase.from('favorites').insert({ user_id: session.user.id, song_id: songId });
    } else {
      await supabase.from('favorites').delete().eq('user_id', session.user.id).eq('song_id', songId);
    }
  };

  const handleRandomSong = () => {
    if (songs.length === 0) return;
    const randomIndex = Math.floor(Math.random() * songs.length);
    const randomSong = songs[randomIndex];
    setCurrentSongId(randomSong.id);
    setCurrentView('main');
    setTranspose(0);
  };

  const handleSaveSong = async (songData: Song) => {
    if (!session) return;
    try {
      const isNew = !songs.find(s => s.id === songData.id);
      const dbSong: any = {
        title: songData.title,
        artist: songData.artist,
        bpm: songData.bpm,
        original_key: songData.key,
        content: songData.content,
        notes: songData.notes,
        youtube_url: songData.youtubeUrl,
        audio_url: songData.audioUrl,
        is_public: songData.is_public,
        shared_with_group_id: songData.shared_with_group_id,
        genres: songData.genres,
        tags: songData.tags
      };
      if (isNew) {
        dbSong.user_id = session.user.id;
        dbSong.forked_from = songData.forked_from;
        const { data, error } = await supabase.from('songs').insert([dbSong]).select().single();
        if (error) throw error;
        const newSong: Song = { ...songData, id: data.id, user_id: session.user.id, is_favorite: false };
        setSongs([newSong, ...songs]);
        setCurrentSongId(data.id);
      } else {
        const { error } = await supabase.from('songs').update(dbSong).eq('id', songData.id);
        if (error) throw error;
        setSongs(songs.map(s => s.id === songData.id ? { ...songData, user_id: s.user_id || session.user.id, is_favorite: s.is_favorite } : s));
      }
      setCurrentView('main');
    } catch (error: any) {
      console.error('Error saving song:', error.message);
    }
  };

  const handleDeleteSong = async (id: string) => {
     if (!session) return;
     try {
       const { error } = await supabase.from('songs').delete().eq('id', id);
       if (error) throw error;
       setSongs(songs.filter(s => s.id !== id));
       setCurrentSongId(null);
       setCurrentView('main');
     } catch(e: any) {
       console.error("Delete error:", e.message);
     }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setCurrentView('landing');
  };

  const createNewSong = () => {
    if (!session) {
      setShowAuthModal(true);
      return;
    }
    setCurrentSongId(null);
    setCurrentView('editor');
  };

  const changeTranspose = (delta: number) => {
    setTranspose(prev => prev + delta);
  };

  const allExistingTags = useMemo(() => {
    const tags = new Set<string>();
    songs.forEach(s => s.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [songs]);

  const currentSong = session 
    ? (songs.find(s => s.id === currentSongId) || null)
    : publicSongData;

  const AuthRequiredState = ({ title, desc }: { title: string, desc: string }) => (
    <div className="h-full flex flex-col items-center justify-center p-6 text-center relative overflow-hidden bg-white dark:bg-slate-950">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/10 blur-[100px] rounded-full"></div>
      <div className="relative z-10 max-w-sm">
        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl border border-slate-200 dark:border-slate-800">
          <Lock className="text-cyan-500" size={32} />
        </div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">{title}</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-10 leading-relaxed font-medium">
          {desc}
        </p>
        <button 
          onClick={() => setShowAuthModal(true)}
          className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-cyan-900/20 active:scale-95"
        >
          Unlock with Account <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );

  const renderMainContent = () => {
    if (currentView === 'landing') {
      return (
        <LandingPage 
          onNavigate={(view, query) => {
            if (query) setInitialSearchQuery(query);
            setCurrentView(view as any);
          }}
          onSelectSong={(id) => { 
            setCurrentSongId(id); 
            setCurrentView('main'); 
            setTranspose(0);
          }} 
        />
      );
    }

    if (currentView === 'help') {
      return <HelpPage onBack={() => setCurrentView(session ? 'main' : 'landing')} />;
    }

    if (currentView === 'chord-dictionary') {
      return <ChordDictionary />;
    }

    if (currentView === 'progressions') {
      return <ChordProgressions />;
    }

    if (currentView === 'search') {
      return (
        <AdvancedSearch
          session={session}
          initialQuery={initialSearchQuery}
          onSelectSong={(id) => {
            setCurrentSongId(id);
            setCurrentView('main');
            setTranspose(0);
            setInitialSearchQuery(''); 
          }}
          onAddSong={createNewSong}
        />
      );
    }

    if (currentView === 'profile') {
      return session ? <Profile user={session.user} songs={songs} onNavigateToGroups={() => setCurrentView('groups')} /> : <AuthRequiredState title="Member Area" desc="Create an account to manage your profile, track your repertoire and sync across devices." />;
    }

    if (currentView === 'setlists') {
      return session ? (
        <SetlistEditor 
          user={session.user} 
          allSongs={songs} 
          groups={groups}
          onBack={() => setCurrentView('landing')} 
        />
      ) : <AuthRequiredState title="Gig Planner" desc="Join the community to create professional setlists, organize your performances and collaborate with your band." />;
    }

    if (currentView === 'groups') {
      return session ? (
        <GroupManager 
          user={session.user}
          onClose={() => setCurrentView('landing')}
        />
      ) : <AuthRequiredState title="Collaboration Hub" desc="Connect with your fellow musicians. Create bands, share arrangements and plan rehearsals together." />;
    }

    if (currentView === 'editor') {
      return session ? (
        <SongEditor 
          key={currentSongId || 'new'}
          initialSong={currentSongId ? currentSong : null} 
          groups={groups}
          existingTags={allExistingTags}
          onSave={handleSaveSong} 
          onCancel={() => {
            setCurrentView('main');
          }}
        />
      ) : <AuthRequiredState title="Song Editor" desc="Please sign in to create and edit professional song sheets in your private library." />;
    }

    if (currentSong) {
      return (
        <SongSheet 
          song={currentSong} 
          transposeSemitones={transpose} 
          notationMode={notationMode}
          onToggleFavorite={(isFav) => handleToggleFavorite(currentSong.id, isFav)}
          session={session}
          isAdmin={isAdmin}
          onOpenAuth={() => setShowAuthModal(true)}
          onEdit={() => setCurrentView('editor')}
          onDelete={handleDeleteSong}
        />
      );
    }

    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500">
        <ListMusic size={64} className="mb-4 opacity-20" />
        <p className="text-lg">Select a song to start.</p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-cyan-600 dark:text-cyan-500">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 font-sans overflow-hidden transition-colors duration-300">
      
      {showAuthModal && <Auth onClose={() => setShowAuthModal(false)} />}
      
      {/* Enhanced PWA Install Banner */}
      {showInstallBanner && (
        <div className="fixed top-20 left-4 right-4 z-[100] bg-white dark:bg-slate-900 border-2 border-cyan-500/30 rounded-2xl p-4 shadow-2xl flex items-center justify-between animate-in slide-in-from-top-10 duration-500 ring-4 ring-cyan-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-purple-600 flex items-center justify-center shadow-lg">
              <Smartphone className="text-white" size={20} />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">Installer Unison App</div>
              <div className="text-[10px] text-slate-500 font-medium">Meilleure expérience et mode hors-ligne</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleInstallClick}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold shadow-md active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Download size={14} /> {deferredPrompt ? 'Installer' : 'Aide'}
            </button>
            <button 
              onClick={() => {
                setShowInstallBanner(false);
                sessionStorage.setItem('pwa_banner_dismissed', 'true');
              }}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
      
      {!isMobile && (
        <Sidebar 
          session={session}
          songs={songs}
          groups={groups}
          pendingInvitesCount={pendingInvitesCount}
          currentSongId={currentSongId}
          currentView={currentView}
          isSidebarOpen={isSidebarOpen}
          onCloseMobile={() => {}}
          onNavigate={setCurrentView}
          onSelectSong={(id) => {
            setCurrentSongId(id);
            setCurrentView('main');
            setTranspose(0);
          }}
          onSignOut={handleSignOut}
          onOpenAuth={() => setShowAuthModal(true)}
          onCreateSong={createNewSong}
        />
      )}

      <main className="flex-1 flex flex-col h-full relative min-w-0 bg-white dark:bg-slate-950 transition-colors duration-300">
        <Navbar 
          session={session}
          songs={songs}
          theme={theme}
          toggleTheme={toggleTheme}
          onOpenAuth={() => setShowAuthModal(true)}
          onSignOut={handleSignOut}
          onNavigateHome={() => { setCurrentView('landing'); setCurrentSongId(null); }}
          onNavigateProfile={() => setCurrentView('profile')}
          onNavigateSetlists={() => setCurrentView('setlists')}
          onRandomSong={handleRandomSong}
          onSelectSong={(id) => {
            setCurrentSongId(id);
            setCurrentView('main');
            setTranspose(0);
          }}
        />

        <header className="h-12 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-6 sticky top-0 z-20 shrink-0">
          <div className="flex items-center gap-3">
            {!isMobile && (
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <PanelLeft size={18} />
              </button>
            )}
            
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest truncate max-w-[150px] md:max-w-none">
              {currentView === 'landing' && "Home"}
              {currentView === 'search' && "Library"}
              {currentView === 'main' && currentSong?.title}
              {currentView === 'editor' && "Editor"}
              {currentView === 'setlists' && "Setlists"}
              {currentView === 'groups' && "Groups"}
              {currentView === 'profile' && "Profile"}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentView === 'main' && currentSong && (
              <div className="flex items-center gap-1 md:gap-2 scale-90 md:scale-100">
                <div className="flex items-center bg-slate-200 dark:bg-slate-800 rounded-md p-0.5 border border-slate-300 dark:border-slate-700">
                  <button onClick={() => changeTranspose(-1)} className="p-1 hover:bg-slate-300 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400"><Minus size={14} /></button>
                  <div className="px-2 font-mono font-bold text-cyan-600 dark:text-cyan-400 text-[10px] md:text-xs">{transpose > 0 ? `+${transpose}` : transpose}</div>
                  <button onClick={() => changeTranspose(1)} className="p-1 hover:bg-slate-300 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400"><Plus size={14} /></button>
                </div>
                <button 
                  onClick={() => setNotationMode(m => m === NotationMode.LETTERS ? NotationMode.DEGREES : NotationMode.LETTERS)}
                  className="p-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                >
                  {notationMode === NotationMode.LETTERS ? <Hash size={14} /> : <Type size={14} />}
                </button>
              </div>
            )}
          </div>
        </header>

        <div className={`flex-1 overflow-y-auto scroll-smooth w-full pb-20 md:pb-6 ${currentView !== 'landing' ? 'px-4 sm:px-8 md:px-10 lg:px-16' : ''}`}>
          <div className={currentView !== 'landing' ? 'max-w-[1600px] mx-auto py-6 md:py-10' : ''}>
            {renderMainContent()}
          </div>
        </div>

        {isMobile && (
          <BottomNav 
            currentView={currentView} 
            onNavigate={setCurrentView} 
            pendingInvitesCount={pendingInvitesCount} 
          />
        )}
      </main>
    </div>
  );
};

export default App;
