import React, { useState, useEffect } from 'react';
import { Song, NotationMode, Group } from './types';
import SongSheet from './components/SongSheet';
import SongEditor from './components/SongEditor';
import Auth from './components/Auth';
import Profile from './components/Profile';
import SetlistEditor from './components/SetlistEditor';
import GroupManager from './components/GroupManager';
import { supabase } from './lib/supabaseClient';
import { 
  Music, 
  Plus, 
  Minus, 
  Edit3, 
  ListMusic, 
  Search,
  Hash,
  Type,
  LogOut,
  Loader2,
  User,
  Settings,
  List,
  Heart,
  Users
} from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [pendingInvitesCount, setPendingInvitesCount] = useState(0);
  
  const [currentSongId, setCurrentSongId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'main' | 'editor' | 'profile' | 'setlists' | 'groups'>('main'); 
  const [transpose, setTranspose] = useState(0);
  const [notationMode, setNotationMode] = useState<NotationMode>(NotationMode.LETTERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // 1. Manage Auth Session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Fetch Data when session exists
  useEffect(() => {
    if (session) {
      fetchSongs();
      fetchGroups();
    } else {
      setSongs([]);
      setGroups([]);
    }
  }, [session, currentView]); // Refetch when view changes to update counts

  const fetchGroups = async () => {
    // Use 'groups(*)' without alias
    const { data, error } = await supabase
      .from('group_members')
      .select('*, groups(*)')
      .eq('user_id', session.user.id);
    
    if (!error && data) {
      // Map 'groups' property
      const accepted = data.filter((m: any) => m.status === 'accepted').map((m: any) => m.groups);
      const pending = data.filter((m: any) => m.status === 'pending');
      setGroups(accepted);
      setPendingInvitesCount(pending.length);
    }
  };

  const fetchSongs = async () => {
    try {
      // 1. Fetch Songs
      const { data: songsData, error: songsError } = await supabase
        .from('songs')
        .select('*')
        .order('updated_at', { ascending: false });

      if (songsError) throw songsError;

      // 2. Fetch Favorites
      const { data: favData, error: favError } = await supabase
        .from('favorites')
        .select('song_id')
        .eq('user_id', session.user.id);
        
      if (favError) throw favError;
      
      const favoriteIds = new Set(favData?.map((f: any) => f.song_id));

      if (songsData) {
        // Map DB fields to Frontend types
        const mappedSongs: Song[] = songsData.map((s: any) => ({
          id: s.id,
          user_id: s.user_id,
          title: s.title,
          artist: s.artist,
          bpm: s.bpm,
          key: s.original_key,
          content: s.content,
          youtubeUrl: s.youtube_url,
          audioUrl: s.audio_url, 
          is_public: s.is_public,
          is_favorite: favoriteIds.has(s.id),
          shared_with_group_id: s.shared_with_group_id
        }));
        setSongs(mappedSongs);
      }
    } catch (error: any) {
      console.error('Error fetching songs:', error.message);
    }
  };

  const handleToggleFavorite = async (songId: string, isFav: boolean) => {
    if (!session) return;
    
    // Update local state immediately
    setSongs(prev => prev.map(s => s.id === songId ? { ...s, is_favorite: isFav } : s));
    
    // Sync with DB
    if (isFav) {
      await supabase.from('favorites').insert({ user_id: session.user.id, song_id: songId });
    } else {
      await supabase.from('favorites').delete().eq('user_id', session.user.id).eq('song_id', songId);
    }
  };

  const currentSong = songs.find(s => s.id === currentSongId) || null;

  const filteredSongs = songs.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.artist.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFav = showFavoritesOnly ? s.is_favorite : true;
    return matchesSearch && matchesFav;
  });

  const handleSaveSong = async (songData: Song) => {
    if (!session) return;

    try {
      const isNew = !songs.find(s => s.id === songData.id);

      // Prepare data for DB
      const dbSong: any = {
        title: songData.title,
        artist: songData.artist,
        bpm: songData.bpm,
        original_key: songData.key,
        content: songData.content,
        youtube_url: songData.youtubeUrl,
        audio_url: songData.audioUrl,
        is_public: songData.is_public,
        shared_with_group_id: songData.shared_with_group_id
      };

      if (isNew) {
        dbSong.user_id = session.user.id;
        // Insert
        const { data, error } = await supabase
          .from('songs')
          .insert([dbSong])
          .select()
          .single();
          
        if (error) throw error;
        
        const newSong: Song = { ...songData, id: data.id, user_id: session.user.id, is_favorite: false };
        setSongs([newSong, ...songs]);
        setCurrentSongId(data.id);
      } else {
        // Update
        const { error } = await supabase
          .from('songs')
          .update(dbSong)
          .eq('id', songData.id);
          
        if (error) throw error;

        // Preserve metadata like user_id and favorites when updating
        setSongs(songs.map(s => s.id === songData.id ? { 
          ...songData, 
          // Preserve original owner ID if it exists, otherwise fallback to current user
          user_id: s.user_id || session.user.id, 
          is_favorite: s.is_favorite 
        } : s));
      }
      
      setCurrentView('main'); // Exit editor
    } catch (error: any) {
      console.error('Error saving song:', error.message);
      alert('Error saving song: ' + error.message);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const createNewSong = () => {
    setCurrentSongId(null);
    setCurrentView('editor');
  };

  const handleEditCurrent = () => {
    setCurrentView('editor');
  };

  const changeTranspose = (delta: number) => {
    setTranspose(prev => prev + delta);
  };

  if (loading) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center text-cyan-500">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  // Render Logic based on View
  const renderContent = () => {
    if (currentView === 'profile') {
      return <Profile user={session.user} songs={songs} />;
    }

    if (currentView === 'setlists') {
      return (
        <SetlistEditor 
          user={session.user} 
          allSongs={songs} 
          groups={groups}
          onBack={() => setCurrentView('main')} 
        />
      );
    }

    if (currentView === 'groups') {
      return (
        <GroupManager 
          user={session.user}
          onClose={() => setCurrentView('main')}
        />
      );
    }

    if (currentView === 'editor') {
      return (
        <SongEditor 
          initialSong={currentSong} 
          groups={groups}
          onSave={handleSaveSong} 
          onCancel={() => {
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
        />
      );
    }

    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500">
        <ListMusic size={64} className="mb-4 opacity-20" />
        <p className="text-lg">Select a song or create a new one.</p>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('main')}>
              <div className="w-10 h-10 bg-cyan-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Music className="text-white" size={24} />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white">ChordCraft</h1>
            </div>
          </div>
          
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text"
              placeholder="Search songs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-sm text-slate-300 focus:outline-none focus:border-cyan-600 placeholder:text-slate-600"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex gap-2">
             <button 
               onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
               className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium border flex items-center justify-center gap-2 transition-colors ${showFavoritesOnly ? 'bg-pink-900/30 border-pink-500/50 text-pink-400' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}`}
             >
               <Heart size={12} fill={showFavoritesOnly ? "currentColor" : "none"} />
               Favs
             </button>
             <button 
               onClick={() => setCurrentView('setlists')}
               className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium border flex items-center justify-center gap-2 transition-colors ${currentView === 'setlists' ? 'bg-cyan-900/30 border-cyan-500/50 text-cyan-400' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}`}
             >
               <List size={12} />
               Setlists
             </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredSongs.length === 0 && (
            <div className="text-center text-slate-500 py-8 text-sm">
              {showFavoritesOnly ? "No favorite songs found." : "No songs found."} <br/> 
            </div>
          )}
          {filteredSongs.map(song => (
            <button
              key={song.id}
              onClick={() => {
                setCurrentSongId(song.id);
                setCurrentView('main');
                setTranspose(0);
              }}
              className={`w-full text-left p-3 rounded-lg transition-all duration-200 group relative ${
                currentSongId === song.id && currentView === 'main'
                  ? 'bg-slate-800 border-l-4 border-cyan-500 shadow-md' 
                  : 'hover:bg-slate-800/50 border-l-4 border-transparent'
              }`}
            >
              <div className={`font-medium mb-1 pr-6 ${currentSongId === song.id && currentView === 'main' ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                {song.title}
              </div>
              <div className="text-xs text-slate-500 flex justify-between">
                <span>{song.artist}</span>
                <span>{song.key}</span>
              </div>
              {/* Indicators */}
              <div className="absolute top-3 right-2 flex flex-col gap-1 items-end">
                {song.is_favorite && (
                  <Heart size={12} className="text-pink-500" fill="currentColor" />
                )}
                {song.shared_with_group_id && (
                  <Users size={12} className="text-purple-400" />
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-slate-800 flex flex-col gap-2">
          
          <button 
            onClick={() => setCurrentView('groups')}
            className={`flex items-center gap-3 px-2 py-3 mb-1 rounded-lg transition-colors relative ${currentView === 'groups' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50'}`}
          >
             <div className="w-8 h-8 rounded-full bg-purple-900/30 flex items-center justify-center text-purple-500 border border-slate-700">
               <Users size={16} />
             </div>
             <div className="flex flex-col items-start">
               <span className="font-medium text-sm">Groups</span>
             </div>
             {pendingInvitesCount > 0 && (
               <div className="absolute right-2 top-3 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                 {pendingInvitesCount}
               </div>
             )}
          </button>

          {/* User Profile Button */}
          <button 
            onClick={() => setCurrentView('profile')}
            className={`flex items-center gap-3 px-2 py-3 mb-2 rounded-lg transition-colors ${currentView === 'profile' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50'}`}
          >
             <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-cyan-500 border border-slate-700">
               <User size={16} />
             </div>
             <div className="flex flex-col items-start">
               <span className="font-medium text-sm">
                 {session.user.user_metadata.full_name || 'Musician'}
               </span>
               <span className="text-[10px] opacity-60">View Profile</span>
             </div>
          </button>

          <button 
            onClick={createNewSong}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors border border-slate-700 hover:border-slate-600"
          >
            <Plus size={16} />
            Add New Song
          </button>

          <button 
            onClick={handleSignOut}
            className="w-full py-2 text-slate-500 hover:text-slate-300 flex items-center justify-center gap-2 text-xs font-medium transition-colors"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative">
        
        {/* Sticky Toolbar */}
        <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-8 sticky top-0 z-20">
          <div className="flex items-center gap-6">
            {/* Show Transpose/Notation ONLY in Main View when song selected */}
            {currentView === 'main' && currentSong && (
              <>
                <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
                  <button 
                    onClick={() => changeTranspose(-1)}
                    className="p-2 hover:bg-slate-700 rounded-md text-slate-400 hover:text-white transition-colors"
                    title="Transpose Down"
                  >
                    <Minus size={18} />
                  </button>
                  <div className="w-24 text-center font-mono font-medium text-cyan-400 text-sm">
                     {transpose > 0 ? `+${transpose}` : transpose} Semi
                  </div>
                  <button 
                    onClick={() => changeTranspose(1)}
                    className="p-2 hover:bg-slate-700 rounded-md text-slate-400 hover:text-white transition-colors"
                    title="Transpose Up"
                  >
                    <Plus size={18} />
                  </button>
                </div>

                <div className="h-6 w-px bg-slate-700"></div>

                <button 
                  onClick={() => setNotationMode(m => m === NotationMode.LETTERS ? NotationMode.DEGREES : NotationMode.LETTERS)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 text-sm font-medium text-slate-300 transition-colors"
                >
                   {notationMode === NotationMode.LETTERS ? <Hash size={18} /> : <Type size={18} />}
                   <span>{notationMode === NotationMode.LETTERS ? 'Letters' : 'Degrees'}</span>
                </button>
              </>
            )}
            
            {currentView === 'profile' && (
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Settings size={20} className="text-slate-400" />
                Settings
              </h2>
            )}

            {currentView === 'setlists' && (
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <List size={20} className="text-slate-400" />
                Setlist Manager
              </h2>
            )}

            {currentView === 'groups' && (
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Users size={20} className="text-slate-400" />
                Group Manager
              </h2>
            )}
          </div>

          <div>
             {currentView === 'main' && currentSong && (
              <button 
                onClick={handleEditCurrent}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-400 rounded-lg text-sm font-medium transition-colors border border-cyan-900/50"
              >
                <Edit3 size={16} />
                <span>Edit Song</span>
              </button>
             )}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 scroll-smooth">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;