import React, { useMemo, useState, useEffect } from 'react';
import { Song, NotationMode } from '../types';
import { transpose, convertToDegree, getSectionType } from '../utils/musicLogic';
import { Music2, Heart } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface SongSheetProps {
  song: Song;
  transposeSemitones: number;
  notationMode: NotationMode;
  onToggleFavorite?: (isFav: boolean) => void;
  className?: string;
}

const SongSheet: React.FC<SongSheetProps> = ({ song, transposeSemitones, notationMode, onToggleFavorite, className = '' }) => {
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    // Sync local state with prop when song changes
    setIsFavorite(!!song.is_favorite);
  }, [song]);

  const toggleFavorite = async () => {
    const newState = !isFavorite;
    setIsFavorite(newState);
    
    // Optimistic update locally, call parent to sync DB
    if (onToggleFavorite) onToggleFavorite(newState);
  };
  
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

  return (
    <div className={`max-w-4xl mx-auto pb-20 ${className}`}>
      {/* Header */}
      <div className="mb-8 border-b border-slate-800 pb-6 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">{song.title}</h1>
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
        </div>
        
        <button 
          onClick={toggleFavorite}
          className={`p-3 rounded-full transition-all ${isFavorite ? 'bg-pink-500/20 text-pink-500' : 'bg-slate-800 text-slate-400 hover:text-pink-400'}`}
        >
          <Heart size={24} fill={isFavorite ? "currentColor" : "none"} />
        </button>
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
      <div className="font-mono text-lg select-text">
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
          
          return (
            <div 
              key={lineIdx} 
              className={`flex flex-wrap items-end ${isTightGroup ? 'mb-0' : 'mb-6'} min-h-[1.5em]`}
            >
              {/* Empty line handler */}
              {line.length === 0 || (line.length === 1 && !line[0].chord && !line[0].lyrics) ? (
                <div className="h-4 w-full"></div>
              ) : (
                line.map((segment, segIdx) => {
                  const chordString = processChord(segment.chord);
                  
                  if (isCurrentLineChords) {
                    return (
                      <div key={segIdx} className="flex">
                        {chordString && (
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

                  return (
                    <div key={segIdx} className="flex flex-col group relative">
                      {chordString && (
                        <div className={`font-bold text-base leading-none select-none mb-1 ${notationMode === NotationMode.DEGREES ? '' : 'text-cyan-400'}`}>
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
    </div>
  );
};

export default SongSheet;