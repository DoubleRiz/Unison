import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { Search, X } from 'lucide-react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { Song, Setlist, SetlistItem, SongItem, TiptapDoc } from '../../types';
import { supabase } from '../../lib/supabaseClient';
import { SongBlock } from './SongBlockNode';
import { SongLookupContext } from './SongLookupContext';
import { SongBlockActionsContext, SongBlockActions } from './SongBlockActionsContext';
import { DocumentToolbar } from './DocumentToolbar';
import { buildInitialDocument, getSongBlockIds, removeOrphanSongBlocks } from '../../utils/setlistDocument';

interface SetlistDocumentEditorProps {
  setlist: Setlist;
  setlistItems: SetlistItem[];
  allSongs: Song[];
  onSongOrderChange: (orderedSetlistSongIds: string[]) => void;
  onSongRemoved: (setlistSongId: string) => void;
  onSongTransposeChange: (setlistSongId: string, newTranspose: number) => void;
  onSongInserted: (item: SongItem) => void;
  onLayoutDocumentChange: (doc: TiptapDoc) => void;
}

const extensions = [
  StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
  Underline,
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  TextStyle,
  Color,
  SongBlock,
];

const buildInitialContent = (setlist: Setlist, setlistItems: SetlistItem[]): { doc: TiptapDoc; needsPersist: boolean } => {
  const validIds = new Set(setlistItems.filter((item) => item.type === 'song').map((item) => item.id));
  const existing = setlist.layout_document;

  if (existing) {
    const cleaned = removeOrphanSongBlocks(existing, validIds);
    return { doc: cleaned, needsPersist: JSON.stringify(cleaned) !== JSON.stringify(existing) };
  }

  return { doc: buildInitialDocument(setlistItems), needsPersist: true };
};

export const SetlistDocumentEditor: React.FC<SetlistDocumentEditorProps> = ({
  setlist, setlistItems, allSongs, onSongOrderChange, onSongRemoved, onSongTransposeChange, onSongInserted, onLayoutDocumentChange,
}) => {
  const songLookup = useMemo(() => {
    const map = new Map<string, Song>();
    allSongs.forEach((song) => map.set(song.id, song));
    return map;
  }, [allSongs]);

  const actions = useMemo<SongBlockActions>(() => ({
    onRemove: onSongRemoved,
    onTransposeChange: onSongTransposeChange,
  }), [onSongRemoved, onSongTransposeChange]);

  const prevSongBlockIds = useRef<string[]>([]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDoc = useRef<TiptapDoc | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initialContent = useMemo(() => buildInitialContent(setlist, setlistItems), [setlist.id]);

  useEffect(() => {
    prevSongBlockIds.current = getSongBlockIds(initialContent.doc);
    if (initialContent.needsPersist) {
      supabase
        .from('setlists')
        .update({ layout_document: initialContent.doc })
        .eq('id', setlist.id)
        .then(({ error }) => {
          if (error) {
            console.error('Failed to persist initial layout document:', error);
            return;
          }
          onLayoutDocumentChange(initialContent.doc);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setlist.id]);

  useEffect(() => () => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      if (pendingDoc.current) saveDocument(pendingDoc.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveDocument = async (doc: TiptapDoc) => {
    const { error } = await supabase.from('setlists').update({ layout_document: doc }).eq('id', setlist.id);
    if (error) {
      console.error('Failed to save layout document:', error);
      return;
    }
    onLayoutDocumentChange(doc);
  };

  const persistDocument = (doc: TiptapDoc) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    pendingDoc.current = doc;
    saveTimer.current = setTimeout(() => {
      pendingDoc.current = null;
      saveDocument(doc);
    }, 1500);
  };

  const editor = useEditor({
    extensions,
    content: initialContent.doc as any,
    onUpdate: ({ editor }) => {
      const doc = editor.getJSON() as TiptapDoc;

      const newIds = getSongBlockIds(doc);
      const prevIds = prevSongBlockIds.current;
      const sameSet = newIds.length === prevIds.length
        && new Set(newIds).size === new Set(prevIds).size
        && newIds.every((id) => prevIds.includes(id));
      if (sameSet && JSON.stringify(newIds) !== JSON.stringify(prevIds)) {
        onSongOrderChange(newIds);
      }
      prevSongBlockIds.current = newIds;

      persistDocument(doc);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setlist.id]);

  const [showSongPicker, setShowSongPicker] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');

  const handleInsertSong = async (song: Song) => {
    const { data, error } = await supabase
      .from('setlist_songs')
      .insert({ setlist_id: setlist.id, song_id: song.id, position: setlistItems.length, transpose: 0 })
      .select()
      .single();

    if (error) {
      console.error('Failed to insert song into setlist:', error);
      return;
    }
    if (!data || !editor) return;

    onSongInserted({ type: 'song', id: data.id, song, transpose: 0 });
    editor.chain()
      .focus()
      .insertContent({ type: 'songBlock', attrs: { setlistSongId: data.id, songId: song.id, transpose: 0 } })
      .insertContent({ type: 'paragraph' })
      .run();
    setShowSongPicker(false);
    setPickerQuery('');
  };

  if (!editor) return null;

  return (
    <div className="flex-1 overflow-y-auto pb-10">
      <SongLookupContext.Provider value={songLookup}>
        <SongBlockActionsContext.Provider value={actions}>
          <DocumentToolbar editor={editor} onInsertSong={() => setShowSongPicker(true)} />
          {setlistItems.length === 0 && (
            <p className="text-center text-sm text-slate-500 mb-3">
              Ajoutez des chansons depuis la vue Liste ou via le bouton "Insérer une chanson".
            </p>
          )}
          <div
            className="mx-auto bg-white text-slate-900 shadow-2xl rounded-sm prose"
            style={{ width: '210mm', minHeight: '297mm', padding: '20mm', maxWidth: '100%' }}
          >
            <EditorContent editor={editor} />
          </div>
          {showSongPicker && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 w-full max-w-md max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-white font-bold">Insérer une chanson</h3>
                  <button onClick={() => setShowSongPicker(false)} className="text-slate-400 hover:text-white">
                    <X size={18} />
                  </button>
                </div>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={pickerQuery}
                    onChange={(e) => setPickerQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-sm text-slate-300 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="overflow-y-auto space-y-1">
                  {allSongs
                    .filter((s) => !setlistItems.find((item) => item.type === 'song' && item.song.id === s.id))
                    .filter((s) =>
                      s.title.toLowerCase().includes(pickerQuery.toLowerCase())
                      || s.artist.toLowerCase().includes(pickerQuery.toLowerCase()))
                    .slice(0, 30)
                    .map((song) => (
                      <button
                        key={song.id}
                        onClick={() => handleInsertSong(song)}
                        className="w-full text-left p-2 hover:bg-slate-800 rounded-lg"
                      >
                        <div className="text-white text-sm font-medium">{song.title}</div>
                        <div className="text-xs text-slate-500">{song.artist}</div>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          )}
        </SongBlockActionsContext.Provider>
      </SongLookupContext.Provider>
    </div>
  );
};
