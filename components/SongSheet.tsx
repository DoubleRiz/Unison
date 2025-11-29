import React, { useMemo } from 'react';
import { Song, NotationMode } from '../types';
import { transpose, convertToDegree } from '../utils/musicLogic';

interface SongSheetProps {
  song: Song;
  transposeSemitones: number;
  notationMode: NotationMode;
}

const SongSheet: React.FC<SongSheetProps> = ({ song, transposeSemitones, notationMode }) => {
  
  // Parse content into structure
  const parsedLines = useMemo(() => {
    const lines = song.content.split('\n');
    
    return lines.map(line => {
      // Split by bracketed chords. 
      // "Hello [G]World" -> ["Hello ", "G", "World"]
      const parts = line.split(/\[(.*?)\]/g);
      
      const segments: { chord: string | null; lyrics: string }[] = [];
      
      // The first part is always text that comes BEFORE the first chord.
      // It has no associated chord on top of it.
      if (parts[0] !== undefined) {
        segments.push({ chord: null, lyrics: parts[0] });
      }
      
      // Subsequent parts come in pairs: [Chord, Lyrics]
      // i=1 is Chord, i=2 is Lyrics following that chord
      for (let i = 1; i < parts.length; i += 2) {
        const chord = parts[i];
        const lyrics = parts[i + 1] || ''; // Empty string if end of line
        segments.push({ chord, lyrics });
      }
      
      return segments;
    });
  }, [song.content]);

  // Helper to check if a line is purely chords (and whitespace)
  const isChordLine = (segments: { chord: string | null; lyrics: string }[]) => {
    if (segments.length === 0) return false;
    // It is a chord line if it has at least one chord AND all lyric segments are just whitespace
    const hasChord = segments.some(s => s.chord !== null);
    const hasOnlyWhitespaceLyrics = segments.every(s => s.lyrics.trim() === '');
    return hasChord && hasOnlyWhitespaceLyrics;
  };

  // Process chords based on settings
  const processChord = (chord: string | null) => {
    if (!chord) return null;

    // 1. Transpose
    const transposedChord = transpose(chord, transposeSemitones);

    // 2. Convert to degree if needed
    if (notationMode === NotationMode.DEGREES) {
      return convertToDegree(chord, song.key); 
    }

    return transposedChord;
  };

  // Renders the chord with syntax highlighting for Degrees
  const renderChordDisplay = (chordString: string | null) => {
    if (!chordString) return null;

    // If we are NOT in Degree mode, just return the standard cyan text
    if (notationMode !== NotationMode.DEGREES) {
      return chordString;
    }

    // If in Degree mode, we try to separate the Root Number from the Quality
    // Regex: Starts with optional b/#, then a digit 1-7. Then capture the rest.
    // Ex: "27sus4" -> Match 1: "2", Match 2: "7sus4"
    // Ex: "b6maj7" -> Match 1: "b6", Match 2: "maj7"
    const match = chordString.match(/^([b#]?[1-7])(.*)$/);

    if (match) {
      return (
        <>
          <span className="text-fuchsia-400">{match[1]}</span>
          <span className="text-cyan-400">{match[2]}</span>
        </>
      );
    }

    // Fallback if regex doesn't match (e.g. "?")
    return chordString;
  };

  // YouTube ID Extractor
  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const youtubeId = song.youtubeUrl ? getYoutubeId(song.youtubeUrl) : null;

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Header */}
      <div className="mb-8 border-b border-slate-800 pb-6">
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

      {/* YouTube Embed */}
      {youtubeId && (
        <div className="mb-8 aspect-video w-full rounded-xl overflow-hidden shadow-2xl shadow-black/50 bg-slate-900">
          <iframe
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${youtubeId}`}
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {/* Sheet Music */}
      <div className="font-mono text-lg select-text">
        {parsedLines.map((line, lineIdx) => {
          const isCurrentLineChords = isChordLine(line);
          const nextLine = parsedLines[lineIdx + 1];
          
          // Tight spacing if this is a chord line followed by lyrics
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
                  
                  // Render Strategy:
                  // 1. Chord Line: Render linearly (Chord + Spacing/Lyrics next to it) to preserve manual spacing.
                  // 2. Lyric Line: Render stacked (Chord on top of Lyrics) for standard ChordPro alignment.
                  
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
                      {/* Chord */}
                      {chordString && (
                        <div className={`font-bold text-base leading-none select-none mb-1 ${notationMode === NotationMode.DEGREES ? '' : 'text-cyan-400'}`}>
                          {renderChordDisplay(chordString)}
                        </div>
                      )}
                      
                      {/* Lyric */}
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