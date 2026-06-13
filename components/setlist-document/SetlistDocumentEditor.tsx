import React, { useEffect, useMemo, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
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
    if (saveTimer.current) clearTimeout(saveTimer.current);
  }, []);

  const persistDocument = (doc: TiptapDoc) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const { error } = await supabase.from('setlists').update({ layout_document: doc }).eq('id', setlist.id);
      if (error) {
        console.error('Failed to save layout document:', error);
        return;
      }
      onLayoutDocumentChange(doc);
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

  if (!editor) return null;

  return (
    <div className="flex-1 overflow-y-auto pb-10">
      <SongLookupContext.Provider value={songLookup}>
        <SongBlockActionsContext.Provider value={actions}>
          <DocumentToolbar editor={editor} onInsertSong={() => {}} />
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
        </SongBlockActionsContext.Provider>
      </SongLookupContext.Provider>
    </div>
  );
};
