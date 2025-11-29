import React, { useState, useEffect } from 'react';
import { Song } from '../types';
import { Save, X, Globe, Lock } from 'lucide-react';

interface SongEditorProps {
  initialSong?: Song | null;
  onSave: (song: Song) => void;
  onCancel: () => void;
}

const SongEditor: React.FC<SongEditorProps> = ({ initialSong, onSave, onCancel }) => {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [bpm, setBpm] = useState<string>(''); // Géré en string pour permettre le champ vide
  const [key, setKey] = useState('C');
  const [content, setContent] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    if (initialSong) {
      setTitle(initialSong.title);
      setArtist(initialSong.artist);
      setBpm(initialSong.bpm ? initialSong.bpm.toString() : '');
      setKey(initialSong.key);
      setContent(initialSong.content);
      setYoutubeUrl(initialSong.youtubeUrl || '');
      setIsPublic(initialSong.is_public);
    } else {
      // Reset for new song
      setTitle('');
      setArtist('');
      setBpm('120');
      setKey('C');
      setContent(`[C]      [G]
Hello world, this is a song
[Am]          [F]
Using chords above the text`);
      setYoutubeUrl('');
      setIsPublic(false);
    }
  }, [initialSong]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: initialSong ? initialSong.id : crypto.randomUUID(),
      // user_id sera ajouté par le contexte d'auth plus tard
      title,
      artist,
      bpm: bpm === '' ? null : Number(bpm),
      key,
      content,
      youtubeUrl,
      is_public: isPublic
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
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Key (e.g. Am, C#)</label>
          <input
            required
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:border-cyan-500 text-white"
            placeholder="C"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">BPM (Optional)</label>
          <input
            type="number"
            value={bpm}
            onChange={(e) => setBpm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:border-cyan-500 text-white placeholder:text-slate-700"
            placeholder="-"
          />
        </div>
         <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">YouTube URL</label>
          <input
            type="text"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:border-cyan-500 text-white"
            placeholder="https://..."
          />
        </div>
      </div>

      {/* Visibility Toggle */}
      <div className="mb-6 p-3 bg-slate-950/50 border border-slate-800 rounded-lg flex items-center justify-between cursor-pointer hover:border-slate-700 transition-colors" onClick={() => setIsPublic(!isPublic)}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isPublic ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'}`}>
            {isPublic ? <Globe size={20} /> : <Lock size={20} />}
          </div>
          <div>
            <div className={`text-sm font-medium ${isPublic ? 'text-cyan-400' : 'text-slate-300'}`}>
              {isPublic ? 'Public Song' : 'Private Song'}
            </div>
            <div className="text-xs text-slate-500">
              {isPublic ? 'Visible to everyone in the community.' : 'Only visible to you.'}
            </div>
          </div>
        </div>
        <div className={`w-12 h-6 rounded-full relative transition-colors ${isPublic ? 'bg-cyan-600' : 'bg-slate-700'}`}>
          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200 ${isPublic ? 'left-7' : 'left-1'}`}></div>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-xs font-medium text-slate-400 mb-1">
          Content (Use [Chord] notation)
        </label>
        <div className="relative">
          <textarea
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-96 bg-slate-950 border border-slate-800 rounded-lg px-4 py-4 font-mono text-sm focus:outline-none focus:border-cyan-500 text-slate-300 leading-relaxed resize-none"
            placeholder={`[C]      [G]
Hello world...`}
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