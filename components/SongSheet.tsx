
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Song, NotationMode } from '../types';
import { transpose, convertToDegree, getSectionType, transposeContent } from '../utils/musicLogic';
import { Music2, Heart, Trash2, AlertTriangle, Edit3, ZoomIn, ZoomOut, Mic, MicOff, Play, Pause, GitBranch, Shield, FileDown, StickyNote, ChevronDown, ChevronUp, FastForward, Rewind, Hash, Type } from 'lucide-react';
import CommentsSection from './CommentsSection';
import ChordTooltip from './ChordTooltip';
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
  const [showVideo, setShowVideo] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // View Settings
  const [fontSize, setFontSize] = useState(1.125); 
  const [showChords, setShowChords] = useState(true);
  const [isPinching, setIsPinching] = useState(false);

  // Auto Scroll State & Refs
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(3); // Level 1 to 7 (Default 3)
  const scrollingRef = useRef(isScrolling);
  const speedRef = useRef(scrollSpeed);
  const scrollPosRef = useRef(0); // High precision float position
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Sync refs with state
  useEffect(() => { scrollingRef.current = isScrolling; }, [isScrolling]);
  useEffect(() => { speedRef.current = scrollSpeed; }, [scrollSpeed]);

  useEffect(() => {
    setIsFavorite(!!song.is_favorite);
    setIsScrolling(false);
  }, [song]);

  // Unified Auto Scroll Logic
  const animateScroll = (time: number) => {
    if (!scrollingRef.current) {
      lastTimeRef.current = null;
      return;
    }

    if (lastTimeRef.current !== null) {
      const deltaTime = time - lastTimeRef.current;
      const scrollableParent = containerRef.current?.closest('.overflow-y-auto') as HTMLElement;
      
      if (scrollableParent) {
        // High precision math: speed * multiplier
        // Level 1 = 0.15px per frame = ~9px/sec (very slow)
        // Level 7 = 1.05px per frame = ~63px/sec
        const move = (speedRef.current * 0.15) * (deltaTime / 16.7);
        
        // Accumulate in float ref
        scrollPosRef.current += move;
        
        // Apply to integer scroll property
        scrollableParent.scrollTop = scrollPosRef.current;

        // Auto stop at the end
        if (scrollableParent.scrollTop + scrollableParent.clientHeight >= scrollableParent.scrollHeight - 5) {
          setIsScrolling(false);
          scrollingRef.current = false;
          return;
        }
      }
    }
    
    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animateScroll);
  };

  // Pinch to Zoom Logic
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    let initialDistance = 0;
    let baseFontSize = 1.125;

    const getDistance = (touches: TouchList) => {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        initialDistance = getDistance(e.touches);
        setIsPinching(true);
        // Using a functional update later to avoid reading state here
        // But we need the starting font size for the current gesture
        // We can capture it once at the start of the gesture
        setFontSize(curr => {
          baseFontSize = curr;
          return curr;
        });
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialDistance > 0) {
        // Prevent default browser zoom to owner the gesture for font-scaling
        if (e.cancelable) e.preventDefault();
        
        const currentDistance = getDistance(e.touches);
        const scale = currentDistance / initialDistance;
        const newFontSize = baseFontSize * scale;
        
        setFontSize(Math.max(0.7, Math.min(newFontSize, 4.0)));
      }
    };

    const handleTouchEnd = () => {
      initialDistance = 0;
      setIsPinching(false);
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);
    element.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, []);

  useEffect(() => {
    const scrollableParent = containerRef.current?.closest('.overflow-y-auto') as HTMLElement;
    
    if (isScrolling) {
      if (scrollableParent) {
        // Sync float ref with actual position before starting
        scrollPosRef.current = scrollableParent.scrollTop;
        scrollableParent.style.scrollBehavior = 'auto';
      }
      lastTimeRef.current = null;
      requestRef.current = requestAnimationFrame(animateScroll);
    } else {
      if (scrollableParent) {
        scrollableParent.style.scrollBehavior = 'smooth';
      }
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    }

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isScrolling]);

  const getYoutubeEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return `https://www.youtube.com/embed/${match[1]}`;
    }
    return null;
  };

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
      const segments: { chord: string | null; lyrics: string; span: number }[] = [];
      if (parts[0] !== undefined) segments.push({ chord: null, lyrics: parts[0], span: parts[0].length });
      for (let i = 1; i < parts.length; i += 2) {
        const chord = parts[i];
        const lyrics = parts[i + 1] || ''; 
        // Span = length of chord + 2 (for brackets) + length of following lyrics
        segments.push({ chord, lyrics, span: chord.length + 2 + lyrics.length });
      }
      return { isSection: false, text: '', segments };
    });
  }, [song.content]);

  const isChordLine = (segments: { chord: string | null; lyrics: string; span: number }[]) => {
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

  const renderChordDisplay = (chordString: string | null, originalChord?: string | null) => {
    if (!chordString) return null;
    let content: React.ReactNode = chordString;
    const isDegree = notationMode === NotationMode.DEGREES;
    
    if (isDegree) {
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

    const shapeChordName = originalChord ? transpose(originalChord, transposeSemitones) : chordString;

    return (
      <span className={`whitespace-pre cursor-default font-bold ${!isDegree ? 'text-cyan-600 dark:text-cyan-400' : ''}`}>
        {content}
      </span>
    );
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
    const sanitizePdfText = (text: string) => {
      return text
        .replace(/[\u00A0\u2000-\u200b\u202f\u205f\u3000]/g, ' ')
        .replace(/\t/g, '    ')
        .replace(/[‘’`]/g, "'")
        .replace(/[“”]/g, '"')
        .replace(/…/g, '...')
        .replace(/œ/g, 'oe').replace(/Œ/g, 'Oe')
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    };

    const lines = transposeContent(song.content, transposeSemitones).split(/\r?\n/);
    lines.forEach(line => {
      if (cursorY > 280) { doc.addPage(); cursorY = 20; }
      
      const sectionName = getSectionType(line);
      if (sectionName) {
        cursorY += 4; 
        doc.setFont("courier", "bold"); 
        doc.setTextColor(0, 0, 0);
        doc.text(sanitizePdfText(line.trim().toUpperCase()), margin, cursorY);
        doc.setFont("courier", "normal"); 
        cursorY += lineHeight; 
        return;
      }

      // Render line with highlighted chords
      const parts = line.split(/\[(.*?)\]/g);
      let currentX = margin;
      
      parts.forEach((part, i) => {
        const isChord = i % 2 === 1;
        if (isChord) {
          doc.setFont("courier", "bold");
          doc.setTextColor(0, 153, 184); // Cyan
        } else {
          doc.setFont("courier", "normal");
          doc.setTextColor(0, 0, 0); // Black
        }
        
        const textToRender = sanitizePdfText(part);
        if (textToRender) {
          doc.text(textToRender, currentX, cursorY);
          currentX += doc.getTextWidth(textToRender);
        }
      });
      
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
      <div className="fixed bottom-24 right-6 md:bottom-10 md:right-10 z-40 flex flex-col items-end gap-3 scale-90 md:scale-100">
        {isScrolling && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 shadow-xl animate-in slide-in-from-bottom-2 duration-300 min-w-[200px]">
             <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Scroll Level</div>
                  <div className="text-xs font-mono font-bold text-cyan-500 bg-cyan-500/10 px-2 py-0.5 rounded">Lvl {scrollSpeed}</div>
                </div>
                <div className="flex items-center gap-3">
                  <input 
                    type="range" 
                    min="1" 
                    max="7" 
                    step="1" 
                    value={scrollSpeed} 
                    onChange={(e) => setScrollSpeed(parseInt(e.target.value))}
                    className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                  />
                </div>
             </div>
          </div>
        )}
        
        <button 
          onClick={() => setIsScrolling(!isScrolling)} 
          className={`h-16 w-16 rounded-full shadow-2xl flex items-center justify-center transition-all border-4 ${isScrolling ? 'bg-cyan-600 text-white border-cyan-400 scale-110' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-transparent hover:border-slate-200 dark:hover:border-slate-600'}`}
        >
           {isScrolling ? (
             <div className="relative">
               <Pause size={32} />
               <div className="absolute -inset-4 bg-cyan-400/20 rounded-full animate-ping"></div>
             </div>
           ) : (
             <Play size={32} fill="currentColor" />
           )}
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

      {/* YouTube Embed */}
      {song.youtubeUrl && getYoutubeEmbedUrl(song.youtubeUrl) && (
        <div className="mb-8">
          <button
            onClick={() => setShowVideo(v => !v)}
            className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors mb-2"
          >
            {showVideo ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showVideo ? 'Masquer la vidéo' : 'Afficher la vidéo'}
          </button>
          {showVideo && (
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute inset-0 w-full h-full rounded-xl border border-slate-200 dark:border-slate-800"
                src={getYoutubeEmbedUrl(song.youtubeUrl)!}
                title={`${song.title} - ${song.artist}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </div>
      )}

      {/* Sheet Music Area */}
      <div className={`font-mono select-text transition-all ${isPinching ? 'duration-0' : 'duration-200'}`} style={{ fontSize: `${fontSize}rem` }}>
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
          const lineHasAnyChord = line.some(s => s.chord !== null);
          if (!showChords && isCurrentLineChords) return null;

          return (
            <div key={lineIdx} 
              className={`flex flex-row flex-nowrap items-end overflow-x-auto whitespace-nowrap ${isCurrentLineChords && showChords ? 'mb-0' : 'mb-2'}`}
              style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'flex-end', minHeight: '1.2em' }}
            >
              {line.length === 0 || (line.length === 1 && !line[0].chord && !line[0].lyrics) ? (
                <div className="h-6 w-full"></div>
              ) : (
                line.map((segment, segIdx) => {
                  const chordString = processChord(segment.chord);
                  const segmentStyle = { flexShrink: 0, flexBasis: 'auto', minWidth: isCurrentLineChords ? `${segment.span}ch` : 'auto' };
                  
                  if (isCurrentLineChords) {
                    return (
                      <div key={segIdx} className="flex flex-row flex-nowrap flex-shrink-0" style={segmentStyle}>
                        {chordString && showChords && (
                          <ChordTooltip chord={chordString}>
                            {renderChordDisplay(chordString, segment.chord)}
                          </ChordTooltip>
                        )}
                        <span className="whitespace-pre text-slate-500">{segment.lyrics}</span>
                      </div>
                    );
                  }

                  // Inline Rendering for mixed lines
                  return (
                    <div key={segIdx} className="flex flex-row items-baseline flex-shrink-0" style={segmentStyle}>
                      {chordString && showChords && (
                        <span className="font-bold text-cyan-600 dark:text-cyan-400 mr-1 select-none">
                          <ChordTooltip chord={chordString}>
                            {renderChordDisplay(chordString, segment.chord)}
                          </ChordTooltip>
                        </span>
                      )}
                      <span className="text-slate-800 dark:text-slate-300 whitespace-pre">
                        {renderStyledText(segment.lyrics)}
                      </span>
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
