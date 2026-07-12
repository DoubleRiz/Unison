
import React, { useState, useEffect, useRef } from 'react';
import { Song, Setlist, SetlistTextNote, NotationMode, Group, SongItem, TextItem, SetlistItem, TiptapDoc } from '../types';
import { supabase } from '../lib/supabaseClient';
import {
  Plus,
  Trash2,
  FileDown,
  GripVertical,
  Search,
  ChevronLeft,
  Calendar,
  Play,
  Minus,
  Edit2,
  X,
  ChevronRight,
  Users,
  User,
  AlertTriangle,
  Hash,
  Type,
  AlignLeft,
  Check,
  Heart,
  ChevronUp,
  ChevronDown,
  Copy,
  MoreVertical
} from 'lucide-react';
import SongSheet from './SongSheet';
import SongEditor from './SongEditor';
import { SetlistDocumentEditor } from './setlist-document/SetlistDocumentEditor';
import { TEXT_COLORS, TEXT_SIZES } from '../constants/textNoteStyles';
import { buildInitialDocument } from '../utils/setlistDocument';
import { exportLayoutDocumentToPdf } from '../utils/setlistDocumentPdf';

const FAVORITES_ID = 'virtual_favorites';

interface SetlistEditorProps {
  user: any;
  allSongs: Song[];
  groups: Group[];
  onBack: () => void;
  onSaveSong?: (song: Song, onSuccess?: () => void) => Promise<void>;
}

const generateId = () => `txt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

// ── SetlistCard ───────────────────────────────────────────────────────────
interface SetlistCardProps {
  list: Setlist;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onDuplicate: (id: string, e: React.MouseEvent) => void;
  onSelect: (l: Setlist) => void;
}

const SetlistCard: React.FC<SetlistCardProps> = ({ list, onDelete, onDuplicate, onSelect }) => (
  <div onClick={() => onSelect(list)}
    className="bg-slate-900 border border-slate-800 rounded-xl p-6 cursor-pointer hover:border-cyan-500/50 transition-all group relative">
    <div className="flex justify-between items-start">
      <div>
        <h3 className="text-xl font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors">{list.title}</h3>
        <div className="text-xs text-slate-500 flex items-center gap-2">
          <Calendar size={12} />
          {new Date(list.created_at).toLocaleDateString()}
        </div>
      </div>
      <div className="flex items-center">
        <button onClick={(e) => onDuplicate(list.id, e)} className="text-slate-600 hover:text-cyan-400 p-2">
          <Copy size={18} />
        </button>
        <button onClick={(e) => onDelete(list.id, e)} className="text-slate-600 hover:text-red-400 p-2">
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  </div>
);

// ──────────────────────────────────────────────────────────────────────────
const SetlistEditor: React.FC<SetlistEditorProps> = ({ user, allSongs, groups, onBack, onSaveSong }) => {
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [currentSetlist, setCurrentSetlist] = useState<Setlist | null>(null);
  const [setlistItems, setSetlistItems] = useState<SetlistItem[]>([]);

  const [newTitle, setNewTitle] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState('');

  // Scroll to library helper
  const libraryRef = useRef<HTMLDivElement>(null);
  const actionsMenuRef = useRef<HTMLDivElement>(null);
  const jumpToLibrary = () => {
    libraryRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Text block editing state
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingTextValue, setEditingTextValue] = useState('');
  const [editingTextColor, setEditingTextColor] = useState<string>('amber');
  const [editingTextSize, setEditingTextSize] = useState<'sm' | 'md' | 'lg'>('md');

  const handleAddTextNote = () => {
    setEditingTextId('new');
    setEditingTextValue('');
    setEditingTextColor('amber');
    setEditingTextSize('md');
  };

  const handleEditNote = (item: TextItem) => {
    setEditingTextId(item.id);
    setEditingTextValue(item.content);
    setEditingTextColor(item.color);
    setEditingTextSize(item.size);
  };

  const saveTextNote = () => {
    if (!editingTextValue.trim() || !currentSetlist || currentSetlist.id === FAVORITES_ID) {
      setEditingTextId(null);
      return;
    }
    
    if (editingTextId === 'new') {
      const newNote: TextItem = {
        type: 'text',
        id: generateId(),
        content: editingTextValue.trim(),
        color: editingTextColor,
        size: editingTextSize
      };
      const newItems = [...setlistItems, newNote];
      setSetlistItems(newItems);
      persistTextNotes(newItems);
    } else {
      const newItems = setlistItems.map(item =>
        item.id === editingTextId && item.type === 'text'
          ? { ...item, content: editingTextValue.trim(), color: editingTextColor, size: editingTextSize }
          : item
      );
      setSetlistItems(newItems);
      persistTextNotes(newItems);
    }
    setEditingTextId(null);
  };

  const [notationMode, setNotationMode] = useState<NotationMode>(NotationMode.LETTERS);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [setlistToDelete, setSetlistToDelete] = useState<string | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [setlistToDuplicate, setSetlistToDuplicate] = useState<string | null>(null);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [performanceMode, setPerformanceMode] = useState(false);
  const [performanceIndex, setPerformanceIndex] = useState(0);
  const [performanceEditingSong, setPerformanceEditingSong] = useState<Song | null>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfTitle, setPdfTitle] = useState('');
  const [setlistView, setSetlistView] = useState<'list' | 'document'>('list');

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => { fetchSetlists(); }, [user]);

  useEffect(() => {
    if (currentSetlist) {
      setEditTitleValue(currentSetlist.title);
      setPdfTitle(`${currentSetlist.title} - ${new Date().toLocaleDateString()}`);
    }
  }, [currentSetlist]);

  // ── Data fetching ────────────────────────────────────────────────────────
  const fetchSetlists = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('setlists')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setSetlists(data);
    setLoading(false);
  };

  const fetchSetlistItems = async (setlistId: string) => {
    if (setlistId === FAVORITES_ID) {
      const favorites = allSongs
        .filter(s => s.is_favorite)
        .map(song => ({
          type: 'song' as const,
          id: `fav_${song.id}`,
          song: song,
          transpose: 0
        }));
      setSetlistItems(favorites);
      return;
    }

    const [{ data, error }, { data: setlistRow, error: setlistError }] = await Promise.all([
      supabase
        .from('setlist_songs')
        .select('*')
        .eq('setlist_id', setlistId)
        .order('position', { ascending: true }),
      supabase
        .from('setlists')
        .select('text_notes')
        .eq('id', setlistId)
        .single()
    ]);

    if (!error && data && !setlistError) {
      const songItems = data.map((item: any) => {
        const song = allSongs.find(s => s.id === item.song_id);
        if (!song) return null;
        return { type: 'song' as const, id: item.id, song, transpose: item.transpose || 0, position: item.position };
      }).filter(Boolean) as (SongItem & { position: number })[];

      const textItems = ((setlistRow?.text_notes || []) as SetlistTextNote[]).map(note => ({
        type: 'text' as const,
        id: note.id,
        content: note.content,
        color: note.color,
        size: note.size,
        position: note.position,
      }));

      const merged = [...songItems, ...textItems]
        .sort((a, b) => a.position - b.position)
        .map(({ position, ...rest }) => rest as SetlistItem);

      setSetlistItems(merged);
    }
  };

  // ── Text notes persistence ───────────────────────────────────────────────
  const persistTextNotes = async (items: SetlistItem[]) => {
    if (!currentSetlist) return;
    const textNotes: SetlistTextNote[] = items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.type === 'text')
      .map(({ item, index }) => {
        const t = item as TextItem;
        return { id: t.id, content: t.content, color: t.color, size: t.size, position: index };
      });
    await supabase.from('setlists').update({ text_notes: textNotes }).eq('id', currentSetlist.id);
    setCurrentSetlist({ ...currentSetlist, text_notes: textNotes });
  };

  // ── Setlist CRUD ─────────────────────────────────────────────────────────
  const handleCreateSetlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const payload: any = { title: newTitle, user_id: user.id };
    if (selectedGroupId) payload.group_id = selectedGroupId;
    const { data, error } = await supabase.from('setlists').insert([payload]).select().single();
    if (!error && data) {
      setSetlists([data, ...setlists]);
      setNewTitle('');
      setSelectedGroupId('');
      handleSelectSetlist(data);
    }
  };

  const handleUpdateSetlistTitle = async () => {
    if (!currentSetlist || currentSetlist.id === FAVORITES_ID || !editTitleValue.trim()) return;

    const { error } = await supabase
      .from('setlists')
      .update({ title: editTitleValue })
      .eq('id', currentSetlist.id);

    if (!error) {
      setCurrentSetlist({ ...currentSetlist, title: editTitleValue });
      setSetlists(setlists.map(s => s.id === currentSetlist.id ? { ...s, title: editTitleValue } : s));
      setIsEditingTitle(false);
    }
  };

  const confirmDuplicateSetlist = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (id === FAVORITES_ID) return;
    setSetlistToDuplicate(id);
    setShowDuplicateModal(true);
  };

  const executeDuplicateSetlist = async () => {
    if (!setlistToDuplicate) return;
    const original = setlists.find(s => s.id === setlistToDuplicate);
    if (!original) {
      setShowDuplicateModal(false);
      setSetlistToDuplicate(null);
      return;
    }

    const { data: newSetlist, error } = await supabase
      .from('setlists')
      .insert([{
        title: `${original.title} (copie)`,
        user_id: user.id,
        group_id: original.group_id ?? null,
        text_notes: original.text_notes || [],
      }])
      .select()
      .single();

    if (!error && newSetlist) {
      const { data: songs } = await supabase
        .from('setlist_songs')
        .select('song_id, position, transpose')
        .eq('setlist_id', original.id);

      if (songs && songs.length > 0) {
        await supabase.from('setlist_songs').insert(
          songs.map(s => ({
            setlist_id: newSetlist.id,
            song_id: s.song_id,
            position: s.position,
            transpose: s.transpose,
          }))
        );
      }

      setSetlists([newSetlist, ...setlists]);
      handleSelectSetlist(newSetlist);
    }

    setShowDuplicateModal(false);
    setSetlistToDuplicate(null);
  };

  const confirmDeleteSetlist = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (id === FAVORITES_ID) return;
    setSetlistToDelete(id);
    setShowDeleteModal(true);
  };

  const executeDeleteSetlist = async () => {
    if (!setlistToDelete) return;

    // Correctly use the setSetlistToDelete setter instead of calling the state value itself.
    await supabase.from('setlists').delete().eq('id', setlistToDelete);
    setSetlists(setlists.filter(s => s.id !== setlistToDelete));
    if (currentSetlist?.id === setlistToDelete) setCurrentSetlist(null);
    setShowDeleteModal(false);
    setSetlistToDelete(null);
  };

  const handleSelectSetlist = (setlist: Setlist) => {
    setCurrentSetlist(setlist);
    fetchSetlistItems(setlist.id);
    setPerformanceMode(false);
    setSetlistView('list');
  };

  useEffect(() => {
    if (!showActionsMenu) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setShowActionsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showActionsMenu]);

  // ── Song management ──────────────────────────────────────────────────────
  const addSongToSetlist = async (song: Song) => {
    if (!currentSetlist || currentSetlist.id === FAVORITES_ID) return;

    if (setlistItems.some(item => item.type === 'song' && item.song.id === song.id)) {
      alert("Song already in setlist");
      return;
    }
    const { data, error } = await supabase.from('setlist_songs')
      .insert({ setlist_id: currentSetlist.id, song_id: song.id, position: setlistItems.length, transpose: 0 })
      .select().single();
    if (!error && data) {
      const newItems = [...setlistItems, { type: 'song' as const, id: data.id, song, transpose: 0 }];
      setSetlistItems(newItems);
    }
  };

  const removeItemFromSetlist = async (itemId: string) => {
    if (currentSetlist?.id === FAVORITES_ID) return;

    const item = setlistItems.find(i => i.id === itemId);
    const newItems = setlistItems.filter(s => s.id !== itemId);
    setSetlistItems(newItems);

    if (item?.type === 'song') {
      await supabase.from('setlist_songs').delete().eq('id', itemId);
    } else if (item?.type === 'text') {
      await persistTextNotes(newItems);
    }
  };

  const updateItemTranspose = async (itemId: string, newTranspose: number) => {
    setSetlistItems(items => items.map(item =>
      item.id === itemId ? { ...item, transpose: newTranspose } : item
    ));

    if (currentSetlist?.id !== FAVORITES_ID) {
      await supabase
        .from('setlist_songs')
        .update({ transpose: newTranspose })
        .eq('id', itemId);
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, position: number) => {
    if (currentSetlist?.id === FAVORITES_ID) return;
    dragItem.current = position;
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, position: number) => {
    if (currentSetlist?.id === FAVORITES_ID) return;
    dragOverItem.current = position;
  };

  const updateAllPositions = async (items: SetlistItem[]) => {
    if (!currentSetlist) return;
    const songUpdates = items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.type === 'song')
      .map(({ item, index }) => {
        const songItem = item as SongItem;
        return {
          id: songItem.id,
          setlist_id: currentSetlist.id,
          song_id: songItem.song.id,
          position: index,
          transpose: songItem.transpose
        };
      });

    await persistTextNotes(items);
    if (songUpdates.length > 0) {
      await supabase.from('setlist_songs').upsert(songUpdates);
    }
  };

  const handleDocumentSongOrderChange = async (orderedSetlistSongIds: string[]) => {
    const songItemsById = new Map(
      setlistItems.filter((item): item is SongItem => item.type === 'song').map((item) => [item.id, item])
    );
    const textItems = setlistItems.filter((item) => item.type === 'text');
    const reorderedSongs = orderedSetlistSongIds
      .map((id) => songItemsById.get(id))
      .filter((item): item is SongItem => item !== undefined);

    const newItems: SetlistItem[] = [...reorderedSongs, ...textItems];
    setSetlistItems(newItems);
    await updateAllPositions(newItems);
  };

  const handleDocumentSongInserted = (newItem: SongItem) => {
    setSetlistItems((items) => [...items, newItem]);
  };

  const handleLayoutDocumentChange = (doc: TiptapDoc) => {
    setCurrentSetlist((prev) => (prev ? { ...prev, layout_document: doc } : prev));
  };

  const handleDragEnd = async (e: React.DragEvent<HTMLDivElement>) => {
    if (currentSetlist?.id === FAVORITES_ID) return;
    e.currentTarget.classList.remove('opacity-50');
    if (!currentSetlist || dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) return;

    const newItems = [...setlistItems];
    const draggedItem = newItems[dragItem.current];
    newItems.splice(dragItem.current, 1);
    newItems.splice(dragOverItem.current, 0, draggedItem);

    dragItem.current = null;
    dragOverItem.current = null;
    setSetlistItems(newItems);
    await updateAllPositions(newItems);
  };

  const moveItem = async (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= setlistItems.length || !currentSetlist || isVirtual) return;
    const newItems = [...setlistItems];
    const item = newItems[fromIndex];
    newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, item);
    setSetlistItems(newItems);
    await updateAllPositions(newItems);
  };

  const startPerformance = () => {
    if (setlistItems.length > 0) { setPerformanceIndex(0); setPerformanceMode(true); }
  };

  // ── PDF Export ────────────────────────────────────────────────────────────
  const exportToPDF = () => {
    if (!currentSetlist || setlistItems.length === 0) return;
    setShowPdfModal(false);

    const layoutDoc = currentSetlist.layout_document ?? buildInitialDocument(setlistItems);
    const doc = exportLayoutDocumentToPdf(layoutDoc, setlistItems, pdfTitle);
    doc.save(`${pdfTitle}.pdf`);
  };

const favoriteSetlist: Setlist = {
  id: FAVORITES_ID,
  user_id: user.id,
  title: 'My Favorites',
  created_at: new Date().toISOString(),
  mode: 'list'
};

if (performanceMode && currentSetlist) {
  const currentItem = setlistItems[performanceIndex];

  if (performanceEditingSong && onSaveSong) {
    const existingTags = [...new Set(allSongs.flatMap(s => s.tags || []))];
    return (
      <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col">
        <div className="h-16 bg-slate-900 border-b border-slate-800 flex items-center px-6 shrink-0">
          <button onClick={() => setPerformanceEditingSong(null)} className="text-slate-400 hover:text-white shrink-0 flex items-center gap-2">
            <ChevronLeft size={24} />
            <span className="text-sm">Back to Perform</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SongEditor
            initialSong={performanceEditingSong}
            groups={groups}
            existingTags={existingTags}
            onSave={(song) => {
              onSaveSong(song, () => {
                setSetlistItems(items =>
                  items.map(item =>
                    item.type === 'song' && item.song.id === song.id
                      ? { ...item, song }
                      : item
                  )
                );
                setPerformanceEditingSong(null);
              });
            }}
            onCancel={() => setPerformanceEditingSong(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col">
      <div className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <button onClick={() => setPerformanceMode(false)} className="text-slate-400 hover:text-white shrink-0"><X size={24} /></button>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-white leading-tight truncate">{currentSetlist.title}</h2>
            <div className="text-[10px] sm:text-xs text-slate-400">{performanceIndex + 1} / {setlistItems.length}</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {currentItem.type === 'song' && onSaveSong && (
            <button
              onClick={() => setPerformanceEditingSong(currentItem.song)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              <Edit2 size={18} />
              <span className="hidden sm:inline">Edit</span>
            </button>
          )}
          <button
            onClick={() => setNotationMode(m => m === NotationMode.LETTERS ? NotationMode.DEGREES : NotationMode.LETTERS)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            {notationMode === NotationMode.LETTERS ? <Hash size={18} /> : <Type size={18} />}
            <span className="hidden sm:inline">{notationMode === NotationMode.LETTERS ? 'Letters' : 'Degrees'}</span>
          </button>
          <div className="h-8 w-px bg-slate-800 mx-2" />
          <button disabled={performanceIndex === 0} onClick={() => setPerformanceIndex(p => p - 1)}
            className="p-2 rounded-full bg-slate-800 text-white disabled:opacity-30 hover:bg-cyan-600 transition-colors">
            <ChevronLeft size={24} />
          </button>
          <div className="text-xl font-mono text-cyan-400 font-bold w-8 text-center">{performanceIndex + 1}</div>
          <button disabled={performanceIndex === setlistItems.length - 1} onClick={() => setPerformanceIndex(p => p + 1)}
            className="p-2 rounded-full bg-slate-800 text-white disabled:opacity-30 hover:bg-cyan-600 transition-colors">
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 scroll-smooth bg-slate-950">
        <div className="max-w-4xl mx-auto">
          {currentItem.type === 'song' ? (
            <SongSheet
              song={currentItem.song}
              transposeSemitones={currentItem.transpose}
              notationMode={notationMode}
            />
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 min-h-[400px] flex items-center justify-center text-center">
              <div className="max-w-2xl">
                <div className={`text-2xl font-bold mb-4 ${TEXT_SIZES[currentItem.size]?.uiClass || ''}`} style={{ color: TEXT_COLORS[currentItem.color]?.hex || '#fff' }}>
                  {currentItem.content}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

if (!currentSetlist) {
  const personalSetlists = setlists.filter(s => !s.group_id);
  const groupSetlists = groups.map(g => ({
    group: g, lists: setlists.filter(s => s.group_id === g.id)
  })).filter(g => g.lists.length > 0);

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Delete Setlist?</h3>
              <p className="text-slate-400 text-sm">Are you sure? This action cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors">Cancel</button>
              <button onClick={executeDeleteSetlist}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {showDuplicateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 bg-cyan-900/20 text-cyan-400 rounded-full flex items-center justify-center mb-4">
                <Copy size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Duplicate Setlist?</h3>
              <p className="text-slate-400 text-sm">A copy of this setlist will be created with all its songs.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDuplicateModal(false)}
                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors">Cancel</button>
              <button onClick={executeDuplicateSetlist}
                className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium transition-colors">Duplicate</button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8 border-b border-slate-800 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Setlists</h1>
          <p className="text-slate-400">Organize your songs for gigs and rehearsals.</p>
        </div>
        <button onClick={onBack} className="text-slate-400 hover:text-white flex items-center gap-2"><ChevronLeft size={20} /> Back</button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6 mb-8">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Create New Setlist</h3>
        <form onSubmit={handleCreateSetlist} className="flex flex-col sm:flex-row gap-3">
          <input type="text" placeholder="Gig at The Pub..." value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 sm:py-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500" />
          {groups.length > 0 && (
            <div className="flex-1 sm:flex-none sm:w-48">
              <select value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 sm:py-2 text-white focus:outline-none focus:border-cyan-500 appearance-none">
                <option value="">Personal</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
          )}
          <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 sm:py-2 rounded-lg flex items-center justify-center gap-2 font-bold shadow-lg shadow-cyan-900/20 active:scale-95 transition-all">
            <Plus size={20} /> Create
          </button>
        </form>
      </div>

      <div className="space-y-8">
        <div>
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <User size={18} className="text-cyan-400" /> Personal
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* VIRTUAL FAVORITES CARD */}
            <div
              onClick={() => handleSelectSetlist(favoriteSetlist)}
              className="bg-gradient-to-br from-pink-900/40 to-slate-900 border border-pink-500/30 rounded-xl p-6 cursor-pointer hover:border-pink-500 transition-all group relative overflow-hidden"
            >
              <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <Heart size={100} fill="currentColor" className="text-pink-500" />
              </div>
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-pink-400 transition-colors flex items-center gap-2">
                    <Heart size={20} fill="currentColor" className="text-pink-500 animate-pulse" /> My Favorites
                  </h3>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    Dynamic List • {allSongs.filter(s => s.is_favorite).length} songs
                  </div>
                </div>
              </div>
            </div>

            {personalSetlists.map(list => (
              <SetlistCard key={list.id} list={list} onDelete={confirmDeleteSetlist} onDuplicate={confirmDuplicateSetlist} onSelect={handleSelectSetlist} />
            ))}
          </div>
        </div>

        {groupSetlists.map(g => (
          <div key={g.group.id}>
            <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Users size={18} className="text-cyan-400" /> {g.group.name}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {g.lists.map(list => <SetlistCard key={list.id} list={list} onDelete={confirmDeleteSetlist} onDuplicate={confirmDuplicateSetlist} onSelect={handleSelectSetlist} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const isVirtual = currentSetlist?.id === FAVORITES_ID;

  return (
    <div className="max-w-6xl mx-auto min-h-[calc(100vh-140px)] flex flex-col relative px-4 sm:px-0">
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Delete Setlist?</h3>
              <p className="text-slate-400 text-sm">Are you sure? This action cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors">Cancel</button>
              <button onClick={executeDeleteSetlist}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {showDuplicateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 bg-cyan-900/20 text-cyan-400 rounded-full flex items-center justify-center mb-4">
                <Copy size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Duplicate Setlist?</h3>
              <p className="text-slate-400 text-sm">A copy of this setlist will be created with all its songs.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDuplicateModal(false)}
                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors">Cancel</button>
              <button onClick={executeDuplicateSetlist}
                className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium transition-colors">Duplicate</button>
            </div>
          </div>
        </div>
      )}

      {editingTextId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">
              {editingTextId === 'new' ? 'Add Text Note' : 'Edit Text Note'}
            </h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Text Content</label>
                <textarea
                  value={editingTextValue}
                  onChange={(e) => setEditingTextValue(e.target.value)}
                  placeholder="Enter your note..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 h-24 resize-none"
                />
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Size</label>
                  <select 
                    value={editingTextSize} 
                    onChange={(e) => setEditingTextSize(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    {Object.entries(TEXT_SIZES).map(([key, size]) => (
                      <option key={key} value={key}>{size.description}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Color</label>
                  <select 
                    value={editingTextColor} 
                    onChange={(e) => setEditingTextColor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    {Object.entries(TEXT_COLORS).map(([key, color]) => (
                      <option key={key} value={key}>{color.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditingTextId(null)} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
              <button 
                onClick={saveTextNote} 
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showPdfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl w-96 shadow-2xl">
          <h3 className="text-xl font-bold text-white mb-4">Export PDF</h3>
          <div className="mb-3">
            <label className="block text-xs font-medium text-slate-400 mb-1">Document title</label>
            <input type="text" value={pdfTitle} onChange={(e) => setPdfTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500" />
          </div>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            Songs and text notes flow <span className="text-slate-300">continuously</span>. A song that doesn't fit on the current page will automatically start on a new one.
          </p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowPdfModal(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
            <button onClick={exportToPDF} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg flex items-center gap-2">
              <FileDown size={16} /> Export
            </button>
          </div>
        </div>
      </div>
    )}

    <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 flex-shrink-0">
      <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
        <button onClick={() => setCurrentSetlist(null)} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white shrink-0">
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-2 min-w-0">
          {isEditingTitle && !isVirtual ? (
            <form
              onSubmit={(e) => { e.preventDefault(); handleUpdateSetlistTitle(); }}
              className="flex items-center gap-2"
            >
              <input
                autoFocus
                type="text"
                value={editTitleValue}
                onChange={(e) => setEditTitleValue(e.target.value)}
                onBlur={handleUpdateSetlistTitle}
                className="bg-slate-950 border border-cyan-500 rounded px-2 py-1 text-xl font-bold text-white focus:outline-none" />
            </form>
          ) : (
            <div className="flex items-center gap-3 group min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-white cursor-pointer flex items-center gap-3 truncate" onClick={() => !isVirtual && setIsEditingTitle(true)}>
                {isVirtual && <Heart size={24} className="text-pink-500 shrink-0" fill="currentColor" />}
                <span className="truncate">{currentSetlist.title}</span>
              </h1>
              {!isVirtual && (
                <button onClick={() => setIsEditingTitle(true)} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-cyan-400 transition-opacity">
                  <Edit2 size={16} />
                </button>
              )}
            </div>
          )}

          {currentSetlist.group_id && (
            <span className="px-2 py-0.5 rounded-full bg-purple-900/30 text-purple-400 text-xs border border-purple-800/50 flex items-center gap-1">
              <Users size={12} />
              Group Setlist
            </span>
          )}

          {isVirtual && (
            <span className="px-2 py-0.5 rounded-full bg-pink-900/30 text-pink-400 text-xs border border-pink-800/50 flex items-center gap-1">
              Smart List
            </span>
          )}
        </div>

        {!isVirtual && (
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 shrink-0">
            <button
              onClick={() => setSetlistView('list')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${setlistView === 'list' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Liste
            </button>
            <button
              onClick={() => setSetlistView('document')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${setlistView === 'document' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Document
            </button>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
        <button
          onClick={() => setNotationMode(m => m === NotationMode.LETTERS ? NotationMode.DEGREES : NotationMode.LETTERS)}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm font-medium text-slate-300 hover:text-white transition-colors"
        >
          {notationMode === NotationMode.LETTERS ? <Hash size={18} /> : <Type size={18} />}
          <span>{notationMode === NotationMode.LETTERS ? 'Letters' : 'Degrees'}</span>
        </button>

        <button
          onClick={startPerformance}
          disabled={setlistItems.length === 0}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
        >
          <Play size={18} />
          Perform
        </button>
        <button onClick={() => setShowPdfModal(true)} disabled={setlistItems.length === 0}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg font-medium transition-colors disabled:opacity-50 text-sm sm:text-base">
          <FileDown size={18} /> <span className="hidden sm:inline">Export PDF</span><span className="sm:hidden">PDF</span>
        </button>

        {!isVirtual && (
          <div className="relative" ref={actionsMenuRef}>
            <button
              onClick={() => setShowActionsMenu(v => !v)}
              className="flex items-center justify-center p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
            >
              <MoreVertical size={18} />
            </button>
            {showActionsMenu && (
              <div className="absolute right-0 mt-2 w-44 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl z-40 overflow-hidden">
                <button
                  onClick={() => { setShowActionsMenu(false); confirmDuplicateSetlist(currentSetlist.id); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-cyan-400 transition-colors text-left"
                >
                  <Copy size={16} /> Duplicate
                </button>
                <button
                  onClick={() => { setShowActionsMenu(false); confirmDeleteSetlist(currentSetlist.id); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-red-400 transition-colors text-left"
                >
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>

    {setlistView === 'list' || isVirtual ? (
    <div className="flex-1 flex flex-col lg:flex-row gap-6 lg:gap-8 overflow-visible lg:overflow-hidden pb-10">
      <div className="w-full lg:w-7/12 flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden min-h-[400px]">
        <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-white">Setlist Order</h3>
            <p className="text-xs text-slate-500">{setlistItems.length} items</p>
          </div>
          {!isVirtual && (
            <div className="flex items-center gap-2">
              <button 
                onClick={jumpToLibrary}
                className="lg:hidden text-xs flex items-center gap-1 bg-cyan-900/30 hover:bg-cyan-900/50 text-cyan-400 py-1.5 px-3 rounded-md transition-colors border border-cyan-800/50"
              >
                <Plus size={14} /> Add Song
              </button>
              <button 
                onClick={handleAddTextNote}
                className="text-xs flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 px-3 rounded-md transition-colors border border-slate-700 hover:border-slate-500"
              >
                <Type size={14} /> <span className="hidden xs:inline">Add Note</span><span className="xs:hidden">Note</span>
              </button>
            </div>
          )}
          {isVirtual && <div className="text-xs text-pink-500 font-bold uppercase tracking-wider">Viewing favorites</div>}
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {setlistItems.length === 0 && (
            <div className="text-center text-slate-500 py-10 text-sm italic">
              {isVirtual ? "You haven't favorited any songs yet." : "This setlist is empty. Add songs from the library."}
            </div>
          )}
          {setlistItems.map((item, index) => (
            <div
              key={item.id}
              draggable={!isVirtual}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnter={(e) => handleDragEnter(e, index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className={`flex items-center gap-3 bg-slate-950 border border-slate-800 p-3 rounded-lg group hover:border-slate-700 ${!isVirtual ? 'cursor-move' : 'cursor-default'}`}
            >
              <div className="flex flex-col items-center justify-center w-10 text-slate-600 gap-0.5 border-r border-slate-800/50 mr-1">
                {!isVirtual && (
                  <button 
                    onClick={() => moveItem(index, index - 1)}
                    disabled={index === 0}
                    className="p-2 hover:text-cyan-400 disabled:opacity-0 transition-all focus:outline-none active:scale-125"
                    title="Move Up"
                  >
                    <ChevronUp size={20} />
                  </button>
                )}
                <span className="text-[10px] font-bold leading-none select-none text-slate-500">{index + 1}</span>
                {!isVirtual && (
                  <button 
                    onClick={() => moveItem(index, index + 1)}
                    disabled={index === setlistItems.length - 1}
                    className="p-2 hover:text-cyan-400 disabled:opacity-0 transition-all focus:outline-none active:scale-125"
                    title="Move Down"
                  >
                    <ChevronDown size={20} />
                  </button>
                )}
                {!isVirtual && <GripVertical className="cursor-grab hover:text-slate-400 mt-1 shrink-0 md:block hidden" style={{ touchAction: 'none' }} size={14} />}
              </div>

              {item.type === 'song' ? (
                <>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white break-words sm:truncate">{item.song.title}</div>
                    <div className="text-xs text-slate-500 break-words sm:truncate">{item.song.artist} • Original: {item.song.key}</div>
                  </div>

                  <div className="flex items-center bg-slate-900 rounded border border-slate-800 mr-2">
                    <button
                      onClick={() => updateItemTranspose(item.id, item.transpose - 1)}
                      className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white"
                    >
                      <Minus size={14} />
                    </button>
                    <div className={`w-8 text-center text-xs font-mono font-bold ${item.transpose !== 0 ? 'text-cyan-400' : 'text-slate-500'}`}>
                      {item.transpose > 0 ? '+' : ''}{item.transpose}
                    </div>
                    <button
                      onClick={() => updateItemTranspose(item.id, item.transpose + 1)}
                      className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 min-w-0 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Type size={14} className="text-slate-500" />
                    <div className={`font-medium truncate ${TEXT_SIZES[item.size]?.uiClass}`} style={{ color: TEXT_COLORS[item.color]?.hex }}>
                      {item.content || 'Text Note'}
                    </div>
                  </div>
                  {!isVirtual && (
                    <button 
                      onClick={() => handleEditNote(item)}
                      className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-md mr-2"
                    >
                      <Edit2 size={14} />
                    </button>
                  )}
                </div>
              )}

              {!isVirtual && (
                  <button
                    onClick={() => removeItemFromSetlist(item.id)}
                    className="text-slate-600 hover:text-red-400 md:opacity-0 group-hover:opacity-100 transition-opacity p-2 ml-auto"
                  >
                    <Trash2 size={18} />
                  </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {!isVirtual && (
      <div ref={libraryRef} className="w-full lg:w-5/12 flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden min-h-[400px]">
          <div className="p-4 border-b border-slate-800 bg-slate-900/50">
            <h3 className="font-bold text-white mb-3">Song Library</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="text"
                placeholder="Search library..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-sm text-slate-300 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {allSongs
              .filter(s =>
                !setlistItems.find(item => item.type === 'song' && item.song.id === s.id) &&
                (s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  s.artist.toLowerCase().includes(searchQuery.toLowerCase()))
              )
              .slice(0, 30)
              .map(song => (
                <div key={song.id} className="flex items-center justify-between p-3 hover:bg-slate-800 rounded-lg transition-colors group">
                  <div className="min-w-0">
                    <div className="font-medium text-slate-200 truncate group-hover:text-white">{song.title}</div>
                    <div className="text-xs text-slate-500">{song.artist}</div>
                  </div>
                  <button
                    onClick={() => addSongToSetlist(song)}
                    className="p-2 sm:p-1.5 bg-slate-800 hover:bg-cyan-600 hover:text-white text-cyan-500 rounded-md transition-colors border border-slate-700 hover:border-cyan-500"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {isVirtual && (
        <div className="w-full lg:w-5/12 flex flex-col items-center justify-center bg-slate-900/50 border border-dashed border-slate-800 rounded-xl p-10 text-center">
          <Heart size={48} className="text-pink-500/20 mb-4" />
          <h4 className="text-white font-bold mb-2">Dynamic List</h4>
          <p className="text-slate-500 text-sm leading-relaxed">
            This list automatically updates whenever you favorite or unfavorite a song in the library.
            Changes to transposition here are local to this session.
          </p>
        </div>
      )}
    </div>
    ) : (
      <SetlistDocumentEditor
        key={currentSetlist.id}
        setlist={currentSetlist}
        setlistItems={setlistItems}
        allSongs={allSongs}
        onSongOrderChange={handleDocumentSongOrderChange}
        onSongRemoved={removeItemFromSetlist}
        onSongTransposeChange={updateItemTranspose}
        onSongInserted={handleDocumentSongInserted}
        onLayoutDocumentChange={handleLayoutDocumentChange}
      />
    )}
  </div>
);
};

export default SetlistEditor;
