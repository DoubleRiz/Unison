
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Song, NotationMode } from '../types';
import { transpose, convertToDegree, getSectionType, transposeContent } from '../utils/musicLogic';
import { Music2, Heart, Trash2, AlertTriangle, Edit3, ZoomIn, ZoomOut, Mic, MicOff, Play, Pause, GitBranch, Shield, FileDown, StickyNote, ChevronDown, ChevronUp } from 'lucide-react';
import CommentsSection from './CommentsSection';
import { jsPDF } from 'jspdf';

interface SongSheetProps {
  song: Song;
  transposeSemitones: number;
  notationMode: NotationMode;
  onToggleFavorite?: (isFav: boolean) => void;
  className?: string;
  session?: any; 
  isAdmin?: boolean;
  onOpenAuth?: () => void;
  onEdit?: () => void;
  onDelete?: (id: string) => void;
}

const SongSheet: React.FC<SongSheetProps> = ({ 
  song, 
  transposeSemitones, 
  notationMode, 
  onToggleFavorite, 
  className = '', 
  session,
  isAdmin = false,
  onOpenAuth,
  onEdit,
  onDelete
}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // View Settings
  const [fontSize, setFontSize] = useState(1.125); // Default 1.125rem (text-lg)
  const [showChords, setShowChords] = useState(true);
  const [showNotes, setShowNotes] = useState(true);

  // Auto Scroll State
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1); // 1 to 10
  const scrollIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Sync local state with prop when song changes
    setIsFavorite(!!song.is_favorite);
    setIsScrolling(false);
  }, [song]);

  // Handle Auto Scroll
  useEffect(() => {
    if (isScrolling) {
      scrollIntervalRef.current = window.setInterval(() => {
        // Try to find the scrollable parent
        const scrollableParent = containerRef.current?.closest('.overflow-y-auto');
        
        if (scrollableParent) {
          scrollableParent.scrollBy(0, scrollSpeed * 0.5);
          if (scrollableParent.scrollTop + scrollableParent.clientHeight >= scrollableParent.scrollHeight - 5) {
             setIsScrolling(false);
          }
        } else {
          window.scrollBy(0, scrollSpeed * 0.5);
          if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 5) {
             setIsScrolling(false);
          }
        }
      }, 30);
    } else {
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    }

    return () => {
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    };
  }, [isScrolling, scrollSpeed]);

  const toggleFavorite = async () => {
    if (!session || !onToggleFavorite) return;
    const newState = !isFavorite;
    setIsFavorite(newState);
    onToggleFavorite(newState);
  };

  const isOwner = session && session.user.id === song.user_id;
  const canEdit = isOwner || isAdmin;
  
  const parsedLines = useMemo(() => {
    const lines = song.content.split('\n');
    return lines.map(line => {
      const sectionType = getSectionType(line);
      if (sectionType) {
        return { isSection: true, text: sectionType, segments: [] };
      }
      const parts = line.split(/\[(.*?)\]/g);
      const segments: { chord: string | null; lyrics: string }[] = [];
      if (parts[0] !== undefined) segments.push({ chord: null, lyrics: parts[0] });
      for (let i = 1; i < parts.length; i += 2) {
        const chord = parts[i];
        const lyrics = parts[i + 1] || ''; 
        segments.push({ chord, lyrics });
      }
      return { isSection: false, text: '', segments };
    });
  }, [song.content]);

  const isChordLine = (segments: { chord: string | null; lyrics: string }[]) => {
    if (segments.length === 0) return false;
    const hasChord = segments.some(s => s.chord !== null);
    const hasOnlyWhitespaceLyrics = segments.every(s => s.lyrics.trim() === '');
    return hasChord && hasOnlyWhitespaceLyrics;
  };

  const processChord = (chord: string | null) => {
    if (!chord) return null;
    const transposedChord = transpose(chord, transposeSemitones);
    if (notationMode === NotationMode.DEGREES) {
      return convertToDegree(chord, song.key); 
    }
    return transposedChord;
  };

  const renderChordDisplay = (chordString: string | null) => {
    if (!chordString) return null;
    let content: React.ReactNode = chordString;
    if (notationMode === NotationMode.DEGREES) {
      const match = chordString.match(/^([b#]?[1-7])(.*)$/);
      if (match) {
        content = (
          <>
            <span className="text-fuchsia-600 dark:text-fuchsia-400">{match[1]}</span>
            <span className="text-cyan-600 dark:text-cyan-400">{match[2]}</span>
          </>
        );
      }
    }
    return <span className="whitespace-pre">{content}{'\u00A0'}{'\u00A0'}</span>;
  };

  const renderStyledText = (text: string) => {
    const parts = text.split(/(\*.*?\*|\(.*?\))/g);
    return parts.map((part, i) => {
      if (part.startsWith('*') && part.endsWith('*')) {
        return <i key={i} className="text-slate-500 dark:text-slate-400">{part.slice(1, -1)}</i>;
      }
      if (part.startsWith('(') && part.endsWith(')')) {
        return <span key={i} className="text-slate-500 text-[0.9em]">{part}</span>;
      }
      return part;
    });
  };

  const youtubeId = song.youtubeUrl ? (song.youtubeUrl.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/)?.[2] || null) : null;

  const adjustFontSize = (delta: number) => {
    setFontSize(prev => Math.max(0.7, Math.min(prev + delta, 4.0)));
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const margin = 10;
    const lineHeight = 6;
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text(song.title, margin, 20);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const keyText = transposeSemitones !== 0 ? `${song.key} -> ${transpose(song.key, transposeSemitones)}` : song.key;
    doc.text(`${song.artist} • ${keyText}`, margin, 28);
    let cursorY = 40;
    doc.setFont("courier", "normal");
    doc.setFontSize(11);
    const lines = transposeContent(song.content, transposeSemitones).split('\n');
    lines.forEach(line => {
      if (cursorY > 280) { doc.addPage(); cursorY = 20; }
      if (getSectionType(line)) {
        cursorY += 4; doc.setFont("courier", "bold"); doc.text(line.trim().toUpperCase(), margin, cursorY);
        doc.setFont("courier", "normal"); cursorY += lineHeight; return;
      }
      doc.text(line.replace(/\[(.*?)\]/g, '$1 '), margin, cursorY);
      cursorY += lineHeight;
    });
    doc.save(`${song.title}.pdf`);
  };

  return (
    <div ref={containerRef} className={`max-w-4xl mx-auto ${className}`}>
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Delete Song?</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">Are you sure you want to delete <span className="text-slate-900 dark:text-white font-medium">"{song.title}"</span>?</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg font-medium">Cancel</button>
              <button onClick={() => { if (onDelete) onDelete(song.id); setShowDeleteConfirm(false); }} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Auto Scroll Floating Controls */}
      <div className="fixed bottom-24 right-6 md:bottom-6 z-40 flex flex-col items-end gap-2 scale-90 md:scale-100">
        <button onClick={() => setIsScrolling(!isScrolling)} className={`h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-all ${isScrolling ? 'bg-cyan-500 text-white animate-pulse' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}>
           {isScrolling ? <Pause size={24} /> : <Play size={24} />}
        </button>
      </div>

      {/* Header */}
      <div className="mb-8 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-2 tracking-tight leading-tight">{song.title}</h1>
            <div className="text-2xl md:text-3xl font-bold text-cyan-600 dark:text-cyan-500 mb-4">{song.artist}</div>
            <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-widest">
                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                  {notationMode === NotationMode.LETTERS ? transpose(song.key, transposeSemitones) : '1'}
                </span>
                {song.bpm && <span>{song.bpm} BPM</span>}
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0 self-end md:self-start">
            {canEdit && onDelete && (
              <button onClick={() => setShowDeleteConfirm(true)} className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-red-500 border border-slate-200 dark:border-slate-700"><Trash2 size={20} /></button>
            )}
            {onEdit && (canEdit || song.shared_with_group_id) && (
              <button onClick={onEdit} className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-cyan-600 border border-slate-200 dark:border-slate-700"><Edit3 size={20} /></button>
            )}
            {session && (
              <button onClick={toggleFavorite} className={`p-3 rounded-xl border transition-all ${isFavorite ? 'bg-pink-100 dark:bg-pink-500/20 text-pink-500 border-pink-200 dark:border-pink-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}>
                <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
              </button>
            )}
          </div>
        </div>

        {/* View Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-100 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-800/50 shadow-sm">
          <div className="flex items-center gap-2">
            <button onClick={() => adjustFontSize(-0.1)} className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white"><ZoomOut size={18} /></button>
            <span className="text-xs text-slate-500 font-mono w-10 text-center">{Math.round(fontSize * 16)}px</span>
            <button onClick={() => adjustFontSize(0.1)} className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white"><ZoomIn size={18} /></button>
            <div className="w-px h-6 bg-slate-300 dark:bg-slate-800 mx-2"></div>
            <button onClick={() => setShowChords(!showChords)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${!showChords ? 'bg-purple-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
              {!showChords ? <Mic size={14} /> : <MicOff size={14} />} {showChords ? 'Hide Chords' : 'Lyrics Only'}
            </button>
          </div>
          <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-bold hover:bg-slate-300 transition-colors"><FileDown size={14} /> EXPORT PDF</button>
        </div>
      </div>

      {/* Sheet Music Area */}
      <div className="font-mono select-text transition-all duration-200" style={{ fontSize: `${fontSize}rem` }}>
        {parsedLines.map((lineObj, lineIdx) => {
          if (lineObj.isSection) {
            return (
              <div key={lineIdx} className="mt-10 mb-6">
                 <span className="inline-block px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-cyan-700 dark:text-cyan-400 text-sm font-black uppercase tracking-[0.2em] shadow-sm">
                   {lineObj.text}
                 </span>
              </div>
            );
          }
          const line = lineObj.segments;
          const isCurrentLineChords = isChordLine(line);
          if (!showChords && isCurrentLineChords) return null;

          return (
            <div key={lineIdx} className={`flex flex-wrap items-end ${isCurrentLineChords && showChords ? 'mb-0' : 'mb-2'} min-h-[1.2em]`}>
              {line.length === 0 || (line.length === 1 && !line[0].chord && !line[0].lyrics) ? (
                <div className="h-6 w-full"></div>
              ) : (
                line.map((segment, segIdx) => {
                  const chordString = processChord(segment.chord);
                  if (isCurrentLineChords) {
                    return (
                      <div key={segIdx} className="flex">
                        {chordString && showChords && <span className={`font-bold select-none text-cyan-600 dark:text-cyan-400`}>{renderChordDisplay(chordString)}</span>}
                        <span className="whitespace-pre text-slate-500">{segment.lyrics}</span>
                      </div>
                    );
                  }
                  return (
                    <div key={segIdx} className="flex flex-col">
                      {chordString && showChords && <div className={`font-bold text-[0.9em] leading-none select-none mb-1 text-cyan-600 dark:text-cyan-400`}>{renderChordDisplay(chordString)}</div>}
                      <div className="text-slate-800 dark:text-slate-300 whitespace-pre leading-none">{renderStyledText(segment.lyrics)}</div>
                    </div>
                  );
                })
              )}
            </div>
          );
        })}
      </div>

      <CommentsSection songId={song.id} session={session} onOpenAuth={onOpenAuth || (() => {})} />
    </div>
  );
};

export default SongSheet;
