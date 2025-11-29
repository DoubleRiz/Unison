import React, { useState, useEffect } from 'react';
import { Song, NotationMode } from './types';
import SongSheet from './components/SongSheet';
import SongEditor from './components/SongEditor';
import Auth from './components/Auth';
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
  User
} from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentSongId, setCurrentSongId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [transpose, setTranspose] = useState(0);
  const [notationMode, setNotationMode] = useState<NotationMode>(NotationMode.LETTERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

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

  // 2. Fetch Songs when session exists
  useEffect(() => {
    if (session) {
      fetchSongs();
    } else {
      setSongs([]);
    }
  }, [session]);

  const fetchSongs = async () => {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      if (data) {
        // Map DB fields to Frontend types if needed (though they match mostly)
        const mappedSongs: Song[] = data.map((s: any) => ({
          id: s.id,
          user_id: s.user_id,
          title: s.title,
          artist: s.artist,
          bpm: s.bpm,
          key: s.original_key, // Mapping DB 'original_key' to frontend 'key'
          content: s.content,
          youtubeUrl: s.youtube_url,
          is_public: s.is_public
        }));
        setSongs(mappedSongs);
        if (mappedSongs.length > 0 && !currentSongId) {
          // Optional: select first song automatically
          // setCurrentSongId(mappedSongs[0].id);
        }
      }
    } catch (error: any) {
      console.error('Error fetching songs:', error.message);
    }
  };

  const currentSong = songs.find(s => s.id === currentSongId) || null;

  const filteredSongs = songs.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveSong = async (songData: Song) => {
    if (!session) return;

    try {
      const isNew = !songs.find(s => s.id === songData.id);

      // Prepare data for DB
      const dbSong = {
        title: songData.title,
        artist: songData.artist,
        bpm: songData.bpm,
        original_key: songData.key,
        content: songData.content,
        youtube_url: songData.youtubeUrl,
        is_public: songData.is_public,
        user_id: session.user.id
      };

      if (isNew) {
        // Insert
        const { data, error } = await supabase
          .from('songs')
          .insert([dbSong])
          .select()
          .single();
          
        if (error) throw error;
        
        const newSong: Song = { ...songData, id: data.id, user_id: session.user.id };
        setSongs([newSong, ...songs]);
        setCurrentSongId(data.id);
      } else {
        // Update
        const { error } = await supabase
          .from('songs')
          .update(dbSong)
          .eq('id', songData.id);
          
        if (error) throw error;

        setSongs(songs.map(s => s.id === songData.id ? songData : s));
      }
      
      setIsEditing(false);
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
    setIsEditing(true);
  };

  const handleEditCurrent = () => {
    setIsEditing(true);
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

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
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
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredSongs.length === 0 && (
            <div className="text-center text-slate-500 py-8 text-sm">
              No songs found. <br/> Create one to get started!
            </div>
          )}
          {filteredSongs.map(song => (
            <button
              key={song.id}
              onClick={() => {
                setCurrentSongId(song.id);
                setIsEditing(false);
                setTranspose(0); // Reset transpose on change
              }}
              className={`w-full text-left p-3 rounded-lg transition-all duration-200 group ${
                currentSongId === song.id 
                  ? 'bg-slate-800 border-l-4 border-cyan-500 shadow-md' 
                  : 'hover:bg-slate-800/50 border-l-4 border-transparent'
              }`}
            >
              <div className={`font-medium mb-1 ${currentSongId === song.id ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                {song.title}
              </div>
              <div className="text-xs text-slate-500 flex justify-between">
                <span>{song.artist}</span>
                <span>{song.key}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-slate-800 flex flex-col gap-2">
          <div className="flex items-center gap-3 px-2 py-3 mb-2 text-sm text-slate-400">
             <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-cyan-500">
               <User size={16} />
             </div>
             <div className="flex flex-col">
               <span className="font-medium text-slate-200">
                 {session.user.user_metadata.full_name || 'Musician'}
               </span>
               <span className="text-xs opacity-60">Online</span>
             </div>
          </div>

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
            {currentSong && !isEditing && (
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
          </div>

          <div>
             {currentSong && !isEditing && (
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
          {isEditing ? (
            <SongEditor 
              initialSong={currentSong} 
              onSave={handleSaveSong} 
              onCancel={() => {
                setIsEditing(false);
                if (!currentSongId && songs.length > 0) {
                    setCurrentSongId(songs[0].id);
                }
              }}
            />
          ) : currentSong ? (
            <SongSheet 
              song={currentSong} 
              transposeSemitones={transpose} 
              notationMode={notationMode}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
              <ListMusic size={64} className="mb-4 opacity-20" />
              <p className="text-lg">Select a song or create a new one.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;