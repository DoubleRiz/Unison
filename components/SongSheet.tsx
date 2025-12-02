
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Song, NotationMode } from '../types';
import { transpose, convertToDegree, getSectionType } from '../utils/musicLogic';
import { Music2, Heart, Trash2, AlertTriangle, Edit3, ZoomIn, ZoomOut, Mic, MicOff, Play, Pause, GitBranch, Shield } from 'lucide-react';
import CommentsSection from './CommentsSection';

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
        // Try to find the scrollable parent (Dashboard main area OR Setlist modal)
        // We look for the closest element with overflow-y-auto
        const scrollableParent = containerRef.current?.closest('.overflow-y-auto');
        
        if (scrollableParent) {
          // Connected Mode / Dashboard Scroll
          scrollableParent.scrollBy(0, scrollSpeed * 0.5);
          
          // Stop if reached bottom (with small buffer)
          if (scrollableParent.scrollTop + scrollableParent.clientHeight >= scrollableParent.scrollHeight - 5) {
             setIsScrolling(false);
          }
        } else {
          // Guest Mode / Window Scroll
          window.scrollBy(0, scrollSpeed * 0.5);
          
          // Stop if reached bottom
          if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 5) {
             setIsScrolling(false);
          }
        }
      }, 30); // ~30fps
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
    
    // Optimistic update locally, call parent to sync DB
    onToggleFavorite(newState);
  };

  const isOwner = session && session.user.id === song.user_id;
  const canEdit = isOwner || isAdmin;
  
  // Parse content into structure
  const parsedLines = useMemo(() => {
    const lines = song.content.split('\n');
    
    return lines.map(line => {
      // 1. Check if line is a Section Header (e.g. [Chorus])
      const sectionType = getSectionType(line);
      if (sectionType) {
        return { isSection: true, text: sectionType, segments: [] };
      }

      // 2. Standard Parsing
      const parts = line.split(/\[(.*?)\]/g);
      const segments: { chord: string | null; lyrics: string }[] = [];
      
      if (parts[0] !== undefined) {
        segments.push({ chord: null, lyrics: parts[0] });
      }
      
      for (let i = 1; i < parts.length; i += 2) {
        const chord = parts[i];
        const lyrics = parts[i + 1] || ''; 
        segments.push({ chord, lyrics });
      }
      
      return { isSection: false, text: '', segments };
    });
  }, [song.content]);

  // Helper to check if a line is purely chords
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
    if (notationMode !== NotationMode.DEGREES) {
      return chordString;
    }
    const match = chordString.match(/^([b#]?[1-7])(.*)$/);
    if (match) {
      return (
        <>
          <span className="text-fuchsia-400">{match[1]}</span>
          <span className="text-cyan-400">{match[2]}</span>
        </>
      );
    }
    return chordString;
  };

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const youtubeId = song.youtubeUrl ? getYoutubeId(song.youtubeUrl) : null;

  const adjustFontSize = (delta: number) => {
    setFontSize(prev => {
      const newSize = prev + delta;
      return Math.max(0.7, Math.min(newSize, 4.0));
    });
  };

  return (
    <div ref={containerRef} className={`max-w-4xl mx-auto pb-32 ${className}`}>
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Delete Song?</h3>
              <p className="text-slate-400 text-sm">
                Are you sure you want to delete <span className="text-white font-medium">"{song.title}"</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (onDelete) onDelete(song.id);
                  setShowDeleteConfirm(false);
                }}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto Scroll Floating Controls */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
        {isScrolling && (
            <div className="bg-slate-900/90 backdrop-blur border border-slate-700 p-3 rounded-xl shadow-2xl mb-2 flex flex-col gap-2 w-16 items-center">
               <span className="text-[10px] font-bold text-slate-400 uppercase">Speed</span>
               <div className="h-32 bg-slate-800 rounded-full w-2 relative">
                  <div 
                    className="absolute bottom-0 w-full bg-cyan-500 rounded-full"
                    style={{ height: `${(scrollSpeed / 5) * 100}%` }}
                  ></div>
                  <input 
                    type="range" 
                    min="1" 
                    max="5" 
                    step="0.5"
                    value={scrollSpeed}
                    onChange={(e) => setScrollSpeed(Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    style={{ writingMode: 'vertical-lr', direction: 'rtl' }} // Hack for vertical range
                  />
               </div>
               <span className="font-mono font-bold text-cyan-400">{scrollSpeed}x</span>
            </div>
        )}
        <button 
          onClick={() => setIsScrolling(!isScrolling)}
          className={`h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-all ${isScrolling ? 'bg-cyan-500 text-white animate-pulse' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}
          title={isScrolling ? "Stop Scrolling" : "Auto Scroll"}
        >
           {isScrolling ? <Pause size={24} /> : <Play size={24} />}
        </button>
      </div>

      {/* Header */}
      <div className="mb-4 border-b border-slate-800 pb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">{song.title}</h1>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-4 text-slate-400 text-sm">
                <span className="px-2 py-1 bg-slate-800 rounded text-cyan-400 font-medium">
                  {notationMode === NotationMode.LETTERS 
                    ? transpose(song.key, transposeSemitones) 
                    : '1'}
                </span>
                <span>{song.artist}</span>
                {song.bpm && (
                  <>
                    <span>•</span>
                    <span>{song.bpm} BPM</span>
                  </>
                )}
              </div>
              
              {/* Fork Source Badge */}
              {song.forked_from && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                   <GitBranch size={12} />
                   <span>Based on an arrangement</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            
            {canEdit && onDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-3 rounded-full bg-slate-800 text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-all border border-slate-700 relative group"
                title={isAdmin && !isOwner ? "Delete (Admin)" : "Delete Song"}
              >
                <Trash2 size={20} />
                {isAdmin && !isOwner && <Shield size={10} className="absolute top-0 right-0 text-yellow-500 fill-yellow-500" />}
              </button>
            )}
            
            {/* Show Edit button if owner, admin, or group permission */}
            {onEdit && (canEdit || song.shared_with_group_id) && (
              <button
                onClick={onEdit}
                className="p-3 rounded-full bg-slate-800 text-slate-400 hover:text-cyan-400 hover:bg-cyan-900/20 transition-all border border-slate-700 relative"
                title={isAdmin && !isOwner ? "Edit (Admin)" : "Edit Song"}
              >
                <Edit3 size={20} />
                {isAdmin && !isOwner && <Shield size={10} className="absolute top-0 right-0 text-yellow-500 fill-yellow-500" />}
              </button>
            )}
            
            {session && (
              <button 
                onClick={toggleFavorite}
                className={`p-3 rounded-full transition-all border border-slate-700 ${isFavorite ? 'bg-pink-500/20 text-pink-500 border-pink-500/30' : 'bg-slate-800 text-slate-400 hover:text-pink-400'}`}
                title="Toggle Favorite"
              >
                <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
              </button>
            )}
          </div>
        </div>

        {/* Tags & Genres */}
        {(song.genres?.length || 0) + (song.tags?.length || 0) > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {song.genres?.map(genre => (
              <span key={genre} className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs border border-slate-700">
                {genre}
              </span>
            ))}
            {song.tags?.map(tag => (
              <span key={tag} className="px-2 py-0.5 rounded-full bg-purple-900/30 text-purple-300 text-xs border border-purple-800/50">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* View Controls Toolbar */}
        <div className="flex items-center justify-between bg-slate-900/50 p-2 rounded-lg border border-slate-800/50">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => adjustFontSize(-0.1)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title="Decrease Font Size"
            >
              <ZoomOut size={18} />
            </button>
            <span className="text-xs text-slate-500 font-mono w-12 text-center">
              {Math.round(fontSize * 16)}px
            </span>
            <button 
              onClick={() => adjustFontSize(0.1)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title="Increase Font Size"
            >
              <ZoomIn size={18} />
            </button>
            
            <div className="w-px h-6 bg-slate-800 mx-2"></div>
            
            <button
              onClick={() => setShowChords(!showChords)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                !showChords 
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' 
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
              title={showChords ? "Hide Chords (Singer Mode)" : "Show Chords"}
            >
              {!showChords ? <Mic size={14} /> : <MicOff size={14} />}
              {showChords ? 'Hide Chords' : 'Lyrics Only'}
            </button>
          </div>
        </div>
      </div>

      {/* Media Player Section */}
      <div className="grid grid-cols-1 gap-6 mb-8">
        {/* YouTube Embed */}
        {youtubeId && (
          <div className="aspect-video w-full rounded-xl overflow-hidden shadow-2xl shadow-black/50 bg-slate-900">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${youtubeId}`}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        {/* Audio Player */}
        {song.audioUrl && (
           <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
             <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-cyan-500">
               <Music2 size={20} />
             </div>
             <div className="flex-1">
                <div className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-semibold">Audio Reference</div>
                <audio controls className="w-full h-8 block" src={song.audioUrl}>
                  Your browser does not support the audio element.
                </audio>
             </div>
           </div>
        )}
      </div>

      {/* Sheet Music */}
      <div 
        className="font-mono select-text min-h-[400px] transition-all duration-200"
        style={{ fontSize: `${fontSize}rem` }}
      >
        {parsedLines.map((lineObj, lineIdx) => {
          // Case 1: Section Header
          if (lineObj.isSection) {
            return (
              <div key={lineIdx} className="mt-8 mb-4">
                 <span className="inline-block px-3 py-1 rounded bg-slate-800 border border-slate-700 text-cyan-400 text-sm font-bold uppercase tracking-widest shadow-sm">
                   {lineObj.text}
                 </span>
              </div>
            );
          }

          const line = lineObj.segments;
          const isCurrentLineChords = isChordLine(line);
          const nextLineObj = parsedLines[lineIdx + 1];
          const nextLine = nextLineObj && !nextLineObj.isSection ? nextLineObj.segments : [];
          
          const isTightGroup = isCurrentLineChords && nextLine && nextLine.length > 0;
          
          // LYRICS ONLY MODE LOGIC
          if (!showChords && isCurrentLineChords) {
            return null; // Skip pure chord lines completely
          }

          return (
            <div 
              key={lineIdx} 
              className={`flex flex-wrap items-end ${isTightGroup && showChords ? 'mb-0' : 'mb-2'} min-h-[1.2em]`}
            >
              {/* Empty line handler */}
              {line.length === 0 || (line.length === 1 && !line[0].chord && !line[0].lyrics) ? (
                <div className="h-4 w-full"></div>
              ) : (
                line.map((segment, segIdx) => {
                  const chordString = processChord(segment.chord);
                  
                  // Scenario: Pure Chord Line (renders horizontally)
                  if (isCurrentLineChords) {
                    return (
                      <div key={segIdx} className="flex">
                        {chordString && showChords && (
                          <span className={`font-bold select-none mr-0.5 ${notationMode === NotationMode.DEGREES ? '' : 'text-cyan-400'}`}>
                            {renderChordDisplay(chordString)}
                          </span>
                        )}
                        <span className="whitespace-pre text-slate-500">
                          {segment.lyrics}
                        </span>
                      </div>
                    );
                  }

                  // Scenario: Mixed/Lyric Line (Vertical Stacking)
                  return (
                    <div key={segIdx} className="flex flex-col group relative">
                      {chordString && showChords && (
                        <div className={`font-bold text-[0.9em] leading-none select-none mb-0.5 ${notationMode === NotationMode.DEGREES ? '' : 'text-cyan-400'}`}>
                          {renderChordDisplay(chordString)}
                        </div>
                      )}
                      
                      <div className="text-slate-300 whitespace-pre leading-none">
                        {segment.lyrics}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          );
        })}
      </div>

      {/* Social / Comments Section */}
      <CommentsSection 
        songId={song.id} 
        session={session} 
        onOpenAuth={onOpenAuth || (() => {})} 
      />
    </div>
  );
};

export default SongSheet;
