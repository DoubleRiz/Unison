
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
import { 
  Minus, 
  Plus, 
  Hash, 
  Type, 
  Loader2, 
  Globe, 
  PanelLeft, 
  Settings, 
  List, 
  Users, 
  Edit3,
  ListMusic,
  AlertTriangle,
  Filter,
  ChevronLeft,
  Music,
  ShieldQuestion
} from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  
  // Navigation & UI State
  const [currentSongId, setCurrentSongId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'landing' | 'main' | 'editor' | 'profile' | 'setlists' | 'groups' | 'search' | 'help'>('landing'); 
  const [transpose, setTranspose] = useState(0);
  const [notationMode, setNotationMode] = useState<NotationMode>(NotationMode.LETTERS);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Duplicate Resolution State
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictSongData, setConflictSongData] = useState<Song | null>(null);
  const [editorTemplate, setEditorTemplate] = useState<Song | null>(null);

  // Responsive: Close sidebar by default on mobile load
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    };
    handleResize(); // Init
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 1. Manage Auth Session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setCurrentView('main');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setShowAuthModal(false);
        if (currentView === 'landing') setCurrentView('main');
      } else {
        setCurrentView('landing');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Use Custom Hook for Data
  const { 
    songs, 
    setSongs, 
    groups, 
    pendingInvitesCount, 
    loading, 
    publicSongData, 
    isAdmin,
    fetchSongs 
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

  const safeUUID = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  const handleSaveSong = async (songData: Song) => {
    if (!session) return;
    
    // Check for Duplicates
    const duplicates = songs.find(s => 
      s.title.trim().toLowerCase() === songData.title.trim().toLowerCase() && 
      s.artist.trim().toLowerCase() === songData.artist.trim().toLowerCase() &&
      s.id !== songData.id // Don't count self if editing
    );

    if (duplicates && !conflictSongData) {
      setConflictSongData(songData);
      setShowConflictModal(true);
      return;
    }

    setConflictSongData(null);
    setShowConflictModal(false);

    try {
      const isNew = !songs.find(s => s.id === songData.id);

      const dbSong: any = {
        title: songData.title,
        artist: songData.artist,
        bpm: songData.bpm,
        original_key: songData.key,
        content: songData.content,
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

        const { data, error } = await supabase
          .from('songs')
          .insert([dbSong])
          .select()
          .single();
          
        if (error) throw error;
        
        const newSong: Song = { ...songData, id: data.id, user_id: session.user.id, is_favorite: false };
        setSongs([newSong, ...songs]);
        setCurrentSongId(data.id);
        // Clear template if it was a fork
        if (editorTemplate) setEditorTemplate(null);
      } else {
        const { error } = await supabase
          .from('songs')
          .update(dbSong)
          .eq('id', songData.id);
          
        if (error) throw error;

        setSongs(songs.map(s => s.id === songData.id ? { 
          ...songData, 
          user_id: s.user_id || session.user.id, 
          is_favorite: s.is_favorite 
        } : s));
      }
      
      setCurrentView('main');
    } catch (error: any) {
      console.error('Error saving song:', error.message);
      alert('Error saving song: ' + error.message);
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
       alert("Failed to delete song.");
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
    setEditorTemplate(null);
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

  // Determine which song to show
  const currentSong = session 
    ? (songs.find(s => s.id === currentSongId) || null)
    : publicSongData;

  // Render Main Content
  const renderMainContent = () => {
    if (currentView === 'landing' && session) {
      return (
        <LandingPage 
          onSelectSong={(id) => { 
            setCurrentSongId(id); 
            setCurrentView('main'); 
            setTranspose(0);
          }} 
          onNavigateToAdvancedSearch={() => setCurrentView('search')}
        />
      );
    }

    if (currentView === 'help') {
      return <HelpPage onBack={() => setCurrentView(session ? 'main' : 'landing')} />;
    }

    if (currentView === 'search') {
      return (
        <AdvancedSearch
          session={session}
          onSelectSong={(id) => {
            setCurrentSongId(id);
            setCurrentView('main');
            setTranspose(0);
          }}
        />
      );
    }

    if (currentView === 'profile' && session) {
      return <Profile user={session.user} songs={songs} />;
    }

    if (currentView === 'setlists' && session) {
      return (
        <SetlistEditor 
          user={session.user} 
          allSongs={songs} 
          groups={groups}
          onBack={() => setCurrentView('main')} 
        />
      );
    }

    if (currentView === 'groups' && session) {
      return (
        <GroupManager 
          user={session.user}
          onClose={() => setCurrentView('main')}
        />
      );
    }

    if (currentView === 'editor' && session) {
      return (
        <SongEditor 
          key={currentSongId || (editorTemplate ? 'fork' : 'new')}
          initialSong={currentSongId ? currentSong : editorTemplate} 
          groups={groups}
          existingTags={allExistingTags}
          onSave={handleSaveSong} 
          onCancel={() => {
            setEditorTemplate(null);
            setCurrentView('main');
            if (!currentSongId && songs.length > 0) {
                setCurrentSongId(songs[0].id);
            }
          }}
        />
      );
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

    if (!session) return (
       <LandingPage 
         onSelectSong={(id) => { setCurrentSongId(id); setCurrentView('main'); }} 
         onNavigateToAdvancedSearch={() => setCurrentView('search')}
       />
    );

    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500">
        <ListMusic size={64} className="mb-4 opacity-20" />
        <p className="text-lg">Select a song or create a new one.</p>
        <div className="flex gap-4 mt-6">
          <button 
            onClick={() => setCurrentView('landing')}
            className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-cyan-400 hover:bg-slate-800 transition-colors flex items-center gap-2"
          >
            <Globe size={16} /> Browse Community
          </button>
          <button 
            onClick={() => setCurrentView('search')}
            className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-purple-400 hover:bg-slate-800 transition-colors flex items-center gap-2"
          >
            <Filter size={16} /> Advanced Library
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center text-cyan-500">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  // GUEST / LANDING VIEW
  if (!session) {
    return (
      <div className="bg-slate-950 min-h-screen font-sans text-slate-200">
        <Navbar 
          session={null} 
          onOpenAuth={() => setShowAuthModal(true)} 
          onSignOut={() => {}}
          onNavigateHome={() => setCurrentView('landing')}
          onNavigateProfile={() => {}}
          onNavigateHelp={() => setCurrentView('help')}
        />
        {showAuthModal && <Auth onClose={() => setShowAuthModal(false)} />}

        {currentView === 'landing' ? (
          <LandingPage 
            onSelectSong={(id) => { 
              setCurrentSongId(id); 
              setCurrentView('main'); 
              setTranspose(0);
            }} 
            onNavigateToAdvancedSearch={() => setCurrentView('search')}
          />
        ) : currentView === 'help' ? (
           <div className="max-w-6xl mx-auto p-4 md:p-6 min-h-[calc(100vh-64px)]">
             <HelpPage onBack={() => setCurrentView('landing')} />
           </div>
        ) : currentView === 'search' ? (
           <AdvancedSearch
             session={null}
             onSelectSong={(id) => {
               setCurrentSongId(id);
               setCurrentView('main');
               setTranspose(0);
             }}
           />
        ) : (
          <div className="max-w-6xl mx-auto p-4 md:p-6 min-h-[calc(100vh-64px)]">
             {/* Sticky Sub-header for tools */}
             <div className="mb-6 flex flex-wrap justify-between items-center sticky top-16 z-20 bg-slate-950/95 py-4 border-b border-slate-800/50 -mx-4 md:-mx-6 px-4 md:px-6 gap-2">
                <button onClick={() => setCurrentView('landing')} className="text-slate-400 hover:text-white flex items-center gap-2 text-sm md:text-base">
                   <ChevronLeft size={20} /> Back
                </button>
                {currentSong && (
                   <div className="flex items-center gap-3">
                     <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                        <button onClick={() => changeTranspose(-1)} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
                          <Minus size={16} />
                        </button>
                        <span className="w-8 md:w-10 text-center text-cyan-400 font-mono font-bold text-sm">{transpose > 0 ? `+${transpose}` : transpose}</span>
                        <button onClick={() => changeTranspose(1)} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
                          <Plus size={16} />
                        </button>
                     </div>
                     
                     <button 
                        onClick={() => setNotationMode(m => m === NotationMode.LETTERS ? NotationMode.DEGREES : NotationMode.LETTERS)}
                        className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm font-medium text-slate-300 hover:text-white transition-colors"
                      >
                         {notationMode === NotationMode.LETTERS ? <Hash size={18} /> : <Type size={18} />}
                         <span className="hidden sm:inline">{notationMode === NotationMode.LETTERS ? 'Letters' : 'Degrees'}</span>
                      </button>
                   </div>
                )}
             </div>
             {renderMainContent()}
          </div>
        )}
      </div>
    );
  }

  // CONNECTED VIEW
  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
      
      {showConflictModal && conflictSongData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 bg-yellow-900/20 text-yellow-500 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Duplicate Song Detected</h3>
              <p className="text-slate-400 text-sm mb-4">
                You already have a song named <span className="text-white font-medium">"{conflictSongData.title}"</span> by <span className="text-white font-medium">{conflictSongData.artist}</span>.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => { setShowConflictModal(false); setConflictSongData(null); }}
                className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Back to Editor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-30 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar 
        session={session}
        songs={songs}
        groups={groups}
        pendingInvitesCount={pendingInvitesCount}
        currentSongId={currentSongId}
        currentView={currentView}
        isSidebarOpen={isSidebarOpen}
        onCloseMobile={() => {
           // On mobile, close sidebar after selection
           if (window.innerWidth < 768) setIsSidebarOpen(false);
        }}
        onNavigate={setCurrentView}
        onSelectSong={(id) => {
          setCurrentSongId(id);
          setCurrentView('main');
          setTranspose(0);
        }}
        onSignOut={handleSignOut}
        onCreateSong={createNewSong}
      />

      <main className="flex-1 flex flex-col h-full relative w-full">
        <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 md:px-6 sticky top-0 z-20 shrink-0">
          
          {/* ZONE GAUCHE : Navigation & Titres */}
          <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-2 rounded-lg transition-colors flex-shrink-0 ${!isSidebarOpen ? 'text-white bg-slate-800' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <PanelLeft size={20} />
            </button>
            
            <div className="truncate">
              {currentView === 'landing' && <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2 truncate"><Globe size={20} className="text-cyan-400 shrink-0" /> <span className="hidden sm:inline">Community Library</span><span className="sm:hidden">Community</span></h2>}
              {currentView === 'search' && <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2 truncate"><Filter size={20} className="text-purple-400 shrink-0" /> <span className="hidden sm:inline">Advanced Library</span><span className="sm:hidden">Library</span></h2>}
              {currentView === 'help' && <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2 truncate"><ShieldQuestion size={20} className="text-cyan-400 shrink-0" /> Help</h2>}
              
              {currentView === 'main' && currentSong && (
                <div className="hidden md:flex items-center gap-2 text-slate-500 text-sm">
                    <Music size={16} />
                    <span className="font-medium">Now Playing</span>
                </div>
              )}
              
              {currentView === 'profile' && <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2 truncate"><Settings size={20} className="text-slate-400 shrink-0" /> Settings</h2>}
              {currentView === 'setlists' && <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2 truncate"><List size={20} className="text-slate-400 shrink-0" /> <span className="hidden sm:inline">Setlist Manager</span><span className="sm:hidden">Setlists</span></h2>}
              {currentView === 'groups' && <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2 truncate"><Users size={20} className="text-slate-400 shrink-0" /> <span className="hidden sm:inline">Group Manager</span><span className="sm:hidden">Groups</span></h2>}
              {currentView === 'editor' && <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2 truncate"><Edit3 size={20} className="text-slate-400 shrink-0" /> Editor</h2>}
            </div>
          </div>

          {/* ZONE DROITE : Outils (Transposeur, Notation, Aide) */}
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
             <button 
                onClick={() => setCurrentView('help')}
                className="p-2 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white transition-colors"
                title="Help"
              >
                <ShieldQuestion size={20} />
              </button>
             
            {currentView === 'main' && currentSong && (
              <>
                <div className="h-8 w-px bg-slate-800 mx-1 hidden sm:block"></div>
                
                <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700 shadow-sm">
                  <button onClick={() => changeTranspose(-1)} className="p-1.5 md:p-2 hover:bg-slate-700 rounded-md text-slate-400 hover:text-white transition-colors"><Minus size={16} /></button>
                  <div className="w-10 md:w-16 text-center font-mono font-bold text-cyan-400 text-sm">{transpose > 0 ? `+${transpose}` : transpose}</div>
                  <button onClick={() => changeTranspose(1)} className="p-1.5 md:p-2 hover:bg-slate-700 rounded-md text-slate-400 hover:text-white transition-colors"><Plus size={16} /></button>
                </div>
                
                <div className="h-8 w-px bg-slate-800 mx-1 hidden sm:block"></div>
                
                <button 
                  onClick={() => setNotationMode(m => m === NotationMode.LETTERS ? NotationMode.DEGREES : NotationMode.LETTERS)}
                  className={`flex items-center gap-2 px-2 md:px-3 py-2 rounded-lg border transition-all ${
                    notationMode === NotationMode.DEGREES 
                      ? 'bg-purple-900/30 border-purple-500/50 text-purple-300' 
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                  title="Toggle Notation Mode"
                >
                    {notationMode === NotationMode.LETTERS ? <Hash size={18} /> : <Type size={18} />}
                    <span className="hidden sm:inline font-medium">{notationMode === NotationMode.LETTERS ? 'Letters' : 'Degrees'}</span>
                </button>
              </>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth w-full">
          {renderMainContent()}
        </div>
      </main>
      
      {showAuthModal && <Auth onClose={() => setShowAuthModal(false)} />}
    </div>
  );
};

export default App;
