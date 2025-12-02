import React, { useState, useEffect, useRef } from 'react';
import { Song, Setlist, NotationMode, Group } from '../types';
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
  Maximize2,
  Minimize2,
  Users,
  User,
  AlertTriangle,
  Hash,
  Type
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import SongSheet from './SongSheet';
import { transposeContent, transpose } from '../utils/musicLogic';

interface SetlistEditorProps {
  user: any;
  allSongs: Song[];
  groups: Group[];
  onBack: () => void;
}

interface SetlistItem {
  id: string; // ID from setlist_songs table
  song: Song;
  transpose: number;
}

const SetlistEditor: React.FC<SetlistEditorProps> = ({ user, allSongs, groups, onBack }) => {
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [currentSetlist, setCurrentSetlist] = useState<Setlist | null>(null);
  const [setlistItems, setSetlistItems] = useState<SetlistItem[]>([]);
  
  // UI State
  const [newTitle, setNewTitle] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>(''); // '' = Personal
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState('');
  
  // Notation Mode (New Feature)
  const [notationMode, setNotationMode] = useState<NotationMode>(NotationMode.LETTERS);

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [setlistToDelete, setSetlistToDelete] = useState<string | null>(null);

  // Performance Mode
  const [performanceMode, setPerformanceMode] = useState(false);
  const [performanceIndex, setPerformanceIndex] = useState(0);

  // PDF Export Modal
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfTitle, setPdfTitle] = useState('');

  // Drag and Drop State
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    fetchSetlists();
  }, [user]);

  useEffect(() => {
    if (currentSetlist) {
      setEditTitleValue(currentSetlist.title);
      setPdfTitle(`${currentSetlist.title} - ${new Date().toLocaleDateString()}`);
    }
  }, [currentSetlist]);

  const fetchSetlists = async () => {
    setLoading(true);
    // Fetch setlists where user is owner OR setlist belongs to a group user is member of
    // Note: RLS handles the security, we just select *
    const { data, error } = await supabase
      .from('setlists')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setSetlists(data);
    }
    setLoading(false);
  };

  const fetchSetlistItems = async (setlistId: string) => {
    const { data, error } = await supabase
      .from('setlist_songs')
      .select('*')
      .eq('setlist_id', setlistId)
      .order('position', { ascending: true });

    if (!error && data) {
      const items = data.map((item: any) => {
        const song = allSongs.find(s => s.id === item.song_id);
        if (!song) return null;
        return {
          id: item.id,
          song: song,
          transpose: item.transpose || 0
        };
      }).filter(Boolean) as SetlistItem[];
      
      setSetlistItems(items);
    }
  };

  const handleCreateSetlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const payload: any = { 
      title: newTitle, 
      user_id: user.id 
    };

    if (selectedGroupId) {
      payload.group_id = selectedGroupId;
    }

    const { data, error } = await supabase
      .from('setlists')
      .insert([payload])
      .select()
      .single();

    if (!error && data) {
      setSetlists([data, ...setlists]);
      setNewTitle('');
      setSelectedGroupId('');
      handleSelectSetlist(data);
    }
  };

  const handleUpdateSetlistTitle = async () => {
    if (!currentSetlist || !editTitleValue.trim()) return;
    
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

  const confirmDeleteSetlist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSetlistToDelete(id);
    setShowDeleteModal(true);
  };

  const executeDeleteSetlist = async () => {
    if (!setlistToDelete) return;
    
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
  };

  const addSongToSetlist = async (song: Song) => {
    if (!currentSetlist) return;

    if (setlistItems.find(item => item.song.id === song.id)) {
      alert("Song already in setlist");
      return;
    }

    const newPosition = setlistItems.length;
    const { data, error } = await supabase
      .from('setlist_songs')
      .insert({
        setlist_id: currentSetlist.id,
        song_id: song.id,
        position: newPosition,
        transpose: 0
      })
      .select()
      .single();

    if (!error && data) {
      setSetlistItems([...setlistItems, {
        id: data.id,
        song: song,
        transpose: 0
      }]);
    }
  };

  const removeSongFromSetlist = async (itemId: string) => {
    await supabase
      .from('setlist_songs')
      .delete()
      .eq('id', itemId);

    setSetlistItems(setlistItems.filter(s => s.id !== itemId));
  };

  const updateItemTranspose = async (itemId: string, newTranspose: number) => {
    setSetlistItems(items => items.map(item => 
      item.id === itemId ? { ...item, transpose: newTranspose } : item
    ));

    await supabase
      .from('setlist_songs')
      .update({ transpose: newTranspose })
      .eq('id', itemId);
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, position: number) => {
    dragItem.current = position;
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, position: number) => {
    dragOverItem.current = position;
  };

  const handleDragEnd = async (e: React.DragEvent<HTMLDivElement>) => {
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

    const updates = newItems.map((item, index) => ({
      id: item.id,
      setlist_id: currentSetlist.id,
      song_id: item.song.id,
      position: index,
      transpose: item.transpose
    }));
    
    await supabase.from('setlist_songs').upsert(updates);
  };

  const startPerformance = () => {
    if (setlistItems.length > 0) {
      setPerformanceIndex(0);
      setPerformanceMode(true);
    }
  };

  const exportToPDF = () => {
    if (!currentSetlist) return;
    setShowPdfModal(false);
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 10;
    const lineHeight = 6;
    
    setlistItems.forEach((item, index) => {
      if (index > 0) doc.addPage();
      
      const song = item.song;
      
      // Header
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(150);
      doc.text(pdfTitle, margin, 10);
      doc.text(`Page ${index + 1}/${setlistItems.length}`, pageWidth - margin, 10, { align: 'right' });

      // Title
      doc.setFontSize(24);
      doc.setTextColor(0);
      doc.setFont("helvetica", "bold");
      doc.text(song.title, margin, 25);
      
      // Metadata
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      const keyText = item.transpose !== 0 
        ? `${song.key} (${item.transpose > 0 ? '+' : ''}${item.transpose}) -> ${transpose(song.key, item.transpose)}`
        : song.key;
        
      doc.text(`${song.artist} • ${keyText}${song.bpm ? ` • ${song.bpm} BPM` : ''}`, margin, 32);
      
      // Content Processing
      doc.setFont("courier", "normal"); 
      doc.setFontSize(11);
      
      let cursorY = 45;
      const transposedContent = transposeContent(song.content, item.transpose);
      const lines = transposedContent.split('\n');

      lines.forEach(line => {
        if (cursorY > pageHeight - margin) {
          doc.addPage();
          cursorY = 20;
        }

        const isSection = /^\[(Intro|Verse|Chorus|Refrain|Bridge|Pont|Pre-Chorus|Outro|Solo|Instrumental|Couplet).*\]$/i.test(line.trim());

        if (isSection) {
          cursorY += 4;
          doc.setFont("courier", "bold");
          doc.setTextColor(100); 
          const sectionText = line.trim().replace('[', '').replace(']', '').toUpperCase();
          doc.text(sectionText, margin, cursorY);
          doc.setFont("courier", "normal");
          doc.setTextColor(0);
          cursorY += lineHeight;
          return;
        }

        let cursorX = margin;
        const segments = line.split(/(\[.*?\])/g);

        segments.forEach(seg => {
           if (seg.startsWith('[') && seg.endsWith(']')) {
             const chord = seg.slice(1, -1); 
             doc.setFont("courier", "bold");
             doc.text(chord, cursorX, cursorY);
             cursorX += doc.getTextWidth(chord);
             doc.setFont("courier", "normal"); 
           } else {
             doc.text(seg, cursorX, cursorY);
             cursorX += doc.getTextWidth(seg);
           }
        });

        cursorY += lineHeight;
      });
    });

    doc.save(`${pdfTitle}.pdf`);
  };

  // Performance View
  if (performanceMode && currentSetlist) {
    const currentItem = setlistItems[performanceIndex];
    return (
      <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col">
        <div className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
             <button onClick={() => setPerformanceMode(false)} className="text-slate-400 hover:text-white">
               <X size={24} />
             </button>
             <div>
               <h2 className="text-lg font-bold text-white leading-tight">{currentSetlist.title}</h2>
               <div className="text-xs text-slate-400">
                 Song {performanceIndex + 1} of {setlistItems.length}
               </div>
             </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
                onClick={() => setNotationMode(m => m === NotationMode.LETTERS ? NotationMode.DEGREES : NotationMode.LETTERS)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                title="Toggle Notation"
            >
                {notationMode === NotationMode.LETTERS ? <Hash size={18} /> : <Type size={18} />}
                <span className="hidden sm:inline">{notationMode === NotationMode.LETTERS ? 'Letters' : 'Degrees'}</span>
            </button>

            <div className="h-8 w-px bg-slate-800 mx-2"></div>

            <button 
              disabled={performanceIndex === 0}
              onClick={() => setPerformanceIndex(p => p - 1)}
              className="p-2 rounded-full bg-slate-800 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-cyan-600 transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="text-xl font-mono text-cyan-400 font-bold w-8 text-center">
               {performanceIndex + 1}
            </div>
            <button 
              disabled={performanceIndex === setlistItems.length - 1}
              onClick={() => setPerformanceIndex(p => p + 1)}
              className="p-2 rounded-full bg-slate-800 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-cyan-600 transition-colors"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth bg-slate-950">
           <div className="max-w-4xl mx-auto">
             <SongSheet 
               song={currentItem.song} 
               transposeSemitones={currentItem.transpose} 
               notationMode={notationMode} // PASSING THE MODE HERE
             />
           </div>
        </div>
      </div>
    );
  }

  // View: List of Setlists
  if (!currentSetlist) {
    // Group setlists for display
    const personalSetlists = setlists.filter(s => !s.group_id);
    const groupSetlists = groups.map(g => ({
      group: g,
      lists: setlists.filter(s => s.group_id === g.id)
    })).filter(g => g.lists.length > 0);

    return (
      <div className="max-w-4xl mx-auto pb-20">
        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm w-full shadow-2xl">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-12 h-12 bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Delete Setlist?</h3>
                <p className="text-slate-400 text-sm">
                  Are you sure you want to delete this setlist? This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={executeDeleteSetlist}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8 border-b border-slate-800 pb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Setlists</h1>
            <p className="text-slate-400">Organize your songs for gigs and rehearsals.</p>
          </div>
          <button onClick={onBack} className="text-slate-400 hover:text-white flex items-center gap-2">
            <ChevronLeft size={20} /> Back
          </button>
        </div>

        {/* Create Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Create New Setlist</h3>
            <form onSubmit={handleCreateSetlist} className="flex gap-2">
              <input 
                type="text" 
                placeholder="Gig at The Pub..." 
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
              {groups.length > 0 && (
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">Personal</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              )}
              <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 rounded-lg flex items-center gap-2 font-medium">
                <Plus size={20} /> Create
              </button>
            </form>
          </div>

        <div className="space-y-8">
          {/* Personal Section */}
          {personalSetlists.length > 0 && (
            <div>
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <User size={18} className="text-cyan-400" /> Personal
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {personalSetlists.map(list => (
                   <SetlistCard key={list.id} list={list} onDelete={confirmDeleteSetlist} onSelect={handleSelectSetlist} />
                ))}
              </div>
            </div>
          )}

          {/* Groups Sections */}
          {groupSetlists.map(g => (
            <div key={g.group.id}>
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Users size={18} className="text-cyan-400" /> {g.group.name}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {g.lists.map(list => (
                   <SetlistCard key={list.id} list={list} onDelete={confirmDeleteSetlist} onSelect={handleSelectSetlist} />
                ))}
              </div>
            </div>
          ))}

          {personalSetlists.length === 0 && groupSetlists.length === 0 && (
            <div className="text-center text-slate-500 py-10">No setlists created yet.</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-140px)] flex flex-col relative">
      {/* PDF Modal */}
      {showPdfModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
           <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl w-96 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-4">Export PDF</h3>
              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-400 mb-1">PDF Title</label>
                <input 
                  type="text" 
                  value={pdfTitle}
                  onChange={(e) => setPdfTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="flex justify-end gap-2">
                 <button onClick={() => setShowPdfModal(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
                 <button onClick={exportToPDF} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg flex items-center gap-2">
                   <FileDown size={16} /> Export
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => setCurrentSetlist(null)} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white">
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex items-center gap-2">
            {isEditingTitle ? (
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
                  className="bg-slate-950 border border-cyan-500 rounded px-2 py-1 text-xl font-bold text-white focus:outline-none"
                />
              </form>
            ) : (
              <div className="flex items-center gap-3 group">
                <h1 className="text-2xl font-bold text-white cursor-pointer" onClick={() => setIsEditingTitle(true)}>
                  {currentSetlist.title}
                </h1>
                <button onClick={() => setIsEditingTitle(true)} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-cyan-400 transition-opacity">
                   <Edit2 size={16} />
                </button>
              </div>
            )}
            
            {/* Show group badge if applicable */}
            {currentSetlist.group_id && (
              <span className="px-2 py-0.5 rounded-full bg-purple-900/30 text-purple-400 text-xs border border-purple-800/50 flex items-center gap-1">
                <Users size={12} />
                Group Setlist
              </span>
            )}
          </div>
        </div>
        
        <div className="flex gap-3">
            {/* Notation Toggle in Main Editor View too? Why not, useful for Perform preview */}
            <button 
                onClick={() => setNotationMode(m => m === NotationMode.LETTERS ? NotationMode.DEGREES : NotationMode.LETTERS)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
                {notationMode === NotationMode.LETTERS ? <Hash size={18} /> : <Type size={18} />}
                <span className="hidden sm:inline">{notationMode === NotationMode.LETTERS ? 'Letters' : 'Degrees'}</span>
            </button>

          <button 
            onClick={startPerformance}
            disabled={setlistItems.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play size={18} />
            Perform
          </button>

          <button 
            onClick={() => setShowPdfModal(true)}
            disabled={setlistItems.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <FileDown size={18} />
            Export PDF
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-8 overflow-hidden">
        {/* Left: Current List (Draggable) */}
        <div className="w-7/12 flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
           <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
             <div>
               <h3 className="font-bold text-white">Setlist Order</h3>
               <p className="text-xs text-slate-500">{setlistItems.length} songs</p>
             </div>
             <div className="text-xs text-slate-500 italic">Drag to reorder</div>
           </div>
           
           <div className="flex-1 overflow-y-auto p-2 space-y-2">
             {setlistItems.length === 0 && (
               <div className="text-center text-slate-500 py-10 text-sm italic">
                 This setlist is empty.<br/>Add songs from the library.
               </div>
             )}
             {setlistItems.map((item, index) => (
               <div 
                 key={item.id}
                 draggable
                 onDragStart={(e) => handleDragStart(e, index)}
                 onDragEnter={(e) => handleDragEnter(e, index)}
                 onDragEnd={handleDragEnd}
                 onDragOver={(e) => e.preventDefault()}
                 className="flex items-center gap-3 bg-slate-950 border border-slate-800 p-3 rounded-lg group hover:border-slate-700 cursor-move"
               >
                 <div className="flex flex-col items-center justify-center w-6 text-slate-600">
                    <span className="text-xs font-bold mb-1">{index + 1}</span>
                    <GripVertical className="cursor-grab hover:text-slate-400" size={16} />
                 </div>
                 
                 <div className="flex-1 min-w-0">
                   <div className="font-medium text-white truncate">{item.song.title}</div>
                   <div className="text-xs text-slate-500 truncate">{item.song.artist} • Original: {item.song.key}</div>
                 </div>

                 {/* Transpose Controls */}
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

                 <button 
                   onClick={() => removeSongFromSetlist(item.id)}
                   className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                 >
                   <Trash2 size={16} />
                 </button>
               </div>
             ))}
           </div>
        </div>

        {/* Right: Search & Add */}
        <div className="w-5/12 flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
           <div className="p-4 border-b border-slate-800">
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
                 !setlistItems.find(item => item.song.id === s.id) && // Exclude already added
                 (s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  s.artist.toLowerCase().includes(searchQuery.toLowerCase()))
               )
               .slice(0, 30) // LIMIT DISPLAY TO 30 ITEMS FOR PERFORMANCE
               .map(song => (
                 <div key={song.id} className="flex items-center justify-between p-3 hover:bg-slate-800 rounded-lg transition-colors group">
                    <div className="min-w-0">
                       <div className="font-medium text-slate-200 truncate group-hover:text-white">{song.title}</div>
                       <div className="text-xs text-slate-500">{song.artist}</div>
                    </div>
                    <button 
                      onClick={() => addSongToSetlist(song)}
                      className="p-1.5 bg-slate-800 hover:bg-cyan-600 hover:text-white text-cyan-500 rounded-md transition-colors border border-slate-700 hover:border-cyan-500"
                    >
                      <Plus size={16} />
                    </button>
                 </div>
               ))
             }
           </div>
        </div>
      </div>
    </div>
  );
};

interface SetlistCardProps {
  list: Setlist;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onSelect: (l: Setlist) => void;
}

const SetlistCard: React.FC<SetlistCardProps> = ({ list, onDelete, onSelect }) => (
  <div 
    onClick={() => onSelect(list)}
    className="bg-slate-900 border border-slate-800 rounded-xl p-6 cursor-pointer hover:border-cyan-500/50 transition-all group relative"
  >
    <div className="flex justify-between items-start">
      <div>
         <h3 className="text-xl font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors">{list.title}</h3>
         <div className="text-xs text-slate-500 flex items-center gap-2">
           <Calendar size={12} />
           {new Date(list.created_at).toLocaleDateString()}
         </div>
      </div>
      <button 
        onClick={(e) => onDelete(list.id, e)}
        className="text-slate-600 hover:text-red-400 p-2"
      >
        <Trash2 size={18} />
      </button>
    </div>
  </div>
);

export default SetlistEditor;