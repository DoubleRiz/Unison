import React, { useState, useEffect } from 'react';
import { Song, Group, GENRES } from '../types';
import { Save, X, Globe, Lock, Music2, Users, Tag, Plus } from 'lucide-react';

interface SongEditorProps {
  initialSong?: Song | null;
  groups: Group[];
  existingTags: string[]; // List of unique tags from all songs
  onSave: (song: Song) => void;
  onCancel: () => void;
}

const KEYS = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];

const SongEditor: React.FC<SongEditorProps> = ({ initialSong, groups, existingTags, onSave, onCancel }) => {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [bpm, setBpm] = useState<string>('');
  
  // Split Key into Root + Quality
  const [keyRoot, setKeyRoot] = useState('C');
  const [keyQuality, setKeyQuality] = useState('Major'); // 'Major' or 'Minor'

  const [content, setContent] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [sharedGroupId, setSharedGroupId] = useState<string>('');
  
  // Genres & Tags
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (initialSong) {
      setTitle(initialSong.title);
      setArtist(initialSong.artist);
      setBpm(initialSong.bpm ? initialSong.bpm.toString() : '');
      
      // Parse Key (Simple parsing logic)
      const isMinor = initialSong.key.endsWith('m');
      const root = isMinor ? initialSong.key.slice(0, -1) : initialSong.key;
      
      setKeyRoot(KEYS.includes(root) ? root : 'C');
      setKeyQuality(isMinor ? 'Minor' : 'Major');

      setContent(initialSong.content);
      setYoutubeUrl(initialSong.youtubeUrl || '');
      setAudioUrl(initialSong.audioUrl || '');
      setIsPublic(initialSong.is_public);
      setSharedGroupId(initialSong.shared_with_group_id || '');
      setSelectedGenres(initialSong.genres || []);
      setTags(initialSong.tags || []);
    } else {
      // Reset for new song
      setTitle('');
      setArtist('');
      setBpm('120');
      setKeyRoot('C');
      setKeyQuality('Major');
      setContent(`[Intro]
[C]     [G]

[Verse 1]
[C]                [G]
This is how you write a song
[Am]             [F]
With sections clearly marked`);
      setYoutubeUrl('');
      setAudioUrl('');
      setIsPublic(false);
      setSharedGroupId('');
      setSelectedGenres([]);
      setTags([]);
    }
  }, [initialSong]);

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter(g => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const handleAddTag = () => {
    const newTag = tagInput.trim();
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reconstruct full key string
    const fullKey = `${keyRoot}${keyQuality === 'Minor' ? 'm' : ''}`;

    onSave({
      id: initialSong ? initialSong.id : crypto.randomUUID(),
      title,
      artist,
      bpm: bpm === '' ? null : Number(bpm),
      key: fullKey,
      content,
      youtubeUrl,
      audioUrl,
      is_public: isPublic,
      shared_with_group_id: sharedGroupId === '' ? null : sharedGroupId,
      genres: selectedGenres,
      tags: tags
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-6 bg-slate-900 rounded-xl border border-slate-800 shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">
          {initialSong ? 'Edit Song' : 'New Song'}
        </h2>
        <button type="button" onClick={onCancel} className="text-slate-400 hover:text-white">
          <X size={24} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Title</label>
          <input
            required
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:border-cyan-500 text-white"
            placeholder="Song Title"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Artist</label>
          <input
            required
            type="text"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:border-cyan-500 text-white"
            placeholder="Artist Name"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Key Selector Split */}
        <div className="col-span-1">
          <label className="block text-xs font-medium text-slate-400 mb-1">Key</label>
          <div className="flex gap-1">
            <select 
              value={keyRoot}
              onChange={(e) => setKeyRoot(e.target.value)}
              className="w-2/3 bg-slate-950 border border-slate-800 rounded-l-lg px-2 py-2 text-white focus:outline-none focus:border-cyan-500 text-sm appearance-none"
            >
              {KEYS.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
            <select
              value={keyQuality}
              onChange={(e) => setKeyQuality(e.target.value)}
              className="w-1/3 bg-slate-950 border border-slate-800 border-l-0 rounded-r-lg px-1 py-2 text-slate-300 focus:outline-none focus:border-cyan-500 text-sm appearance-none"
            >
              <option value="Major">Maj</option>
              <option value="Minor">min</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">BPM</label>
          <input
            type="number"
            value={bpm}
            onChange={(e) => setBpm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:border-cyan-500 text-white placeholder:text-slate-700"
            placeholder="-"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
         <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">YouTube URL</label>
          <input
            type="text"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:border-cyan-500 text-white placeholder:text-slate-700"
            placeholder="https://youtube.com/..."
          />
        </div>
         <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Audio URL (MP3/WAV)</label>
          <div className="relative">
            <input
              type="text"
              value={audioUrl}
              onChange={(e) => setAudioUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-cyan-500 text-white placeholder:text-slate-700"
              placeholder="https://example.com/song.mp3"
            />
            <Music2 className="absolute left-3 top-2.5 text-slate-600" size={14} />
          </div>
        </div>
      </div>

      {/* Genres */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-slate-400 mb-2">Genres</label>
        <div className="flex flex-wrap gap-2">
          {GENRES.map(genre => (
            <button
              key={genre}
              type="button"
              onClick={() => toggleGenre(genre)}
              className={`px-3 py-1 text-xs rounded-full border transition-all ${
                selectedGenres.includes(genre)
                  ? 'bg-cyan-600 border-cyan-500 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="mb-6">
        <label className="block text-xs font-medium text-slate-400 mb-2">Tags</label>
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-2 flex flex-wrap gap-2 min-h-[46px] items-center">
          {tags.map(tag => (
            <span key={tag} className="bg-purple-900/30 text-purple-300 border border-purple-800/50 px-2 py-1 rounded text-xs flex items-center gap-1">
              #{tag}
              <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-white">
                <X size={12} />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            className="bg-transparent text-sm text-white focus:outline-none flex-1 min-w-[120px]"
            placeholder="Add tag & press Enter..."
            list="tag-suggestions"
          />
          <datalist id="tag-suggestions">
            {existingTags.map(tag => (
              <option key={tag} value={tag} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Visibility Toggle */}
        <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-lg flex items-center justify-between cursor-pointer hover:border-slate-700 transition-colors" onClick={() => setIsPublic(!isPublic)}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isPublic ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'}`}>
              {isPublic ? <Globe size={20} /> : <Lock size={20} />}
            </div>
            <div>
              <div className={`text-sm font-medium ${isPublic ? 'text-cyan-400' : 'text-slate-300'}`}>
                {isPublic ? 'Public Song' : 'Private Song'}
              </div>
              <div className="text-xs text-slate-500">
                {isPublic ? 'Visible to everyone.' : 'Only visible to you/group.'}
              </div>
            </div>
          </div>
          <div className={`w-12 h-6 rounded-full relative transition-colors ${isPublic ? 'bg-cyan-600' : 'bg-slate-700'}`}>
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200 ${isPublic ? 'left-7' : 'left-1'}`}></div>
          </div>
        </div>

        {/* Group Permission Toggle */}
        {groups.length > 0 && (
          <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-lg flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
              <Users size={20} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-purple-300 mb-1">
                Allow Group Editing
              </div>
              <select 
                value={sharedGroupId}
                onChange={(e) => setSharedGroupId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded text-xs text-white py-1 px-2 focus:outline-none"
              >
                <option value="">No Group (Only Me)</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="mb-6">
        <label className="block text-xs font-medium text-slate-400 mb-1">
          Content (Use [Chord] notation, use [Chorus] for sections)
        </label>
        <div className="relative">
          <textarea
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-96 bg-slate-950 border border-slate-800 rounded-lg px-4 py-4 font-mono text-sm focus:outline-none focus:border-cyan-500 text-slate-300 leading-relaxed resize-none"
            placeholder={`[Intro]
[C]      [G]

[Verse 1]
[C]                 [G]
This is how you write a song...`}
          />
          <div className="absolute top-2 right-2 opacity-50 text-[10px] text-slate-500 bg-slate-900/80 px-2 py-1 rounded pointer-events-none border border-slate-800">
            Use monospace spaces to align
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg flex items-center gap-2 font-medium transition-colors"
        >
          <Save size={18} />
          Save Song
        </button>
      </div>
    </form>
  );
};

export default SongEditor;