
import React, { useState } from 'react';
import { Grid3X3 } from 'lucide-react';

const INSTRUMENTS = ['Guitar', 'Ukulele', 'Piano'];
const ROOTS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const QUALITIES = [
  { label: 'Major', suffix: '', pianoIntervals: [0, 4, 7] },
  { label: 'Minor', suffix: 'm', pianoIntervals: [0, 3, 7] },
  { label: '7', suffix: '7', pianoIntervals: [0, 4, 7, 10] },
  { label: 'Major 7', suffix: 'maj7', pianoIntervals: [0, 4, 7, 11] },
  { label: 'Minor 7', suffix: 'm7', pianoIntervals: [0, 3, 7, 10] },
  { label: 'Sus4', suffix: 'sus4', pianoIntervals: [0, 5, 7] },
  { label: 'Diminished', suffix: 'dim', pianoIntervals: [0, 3, 6] },
];

// Data format: [String 6, String 5, ... String 1]
// -1 = Muted, 0 = Open, >0 = Fret
const GUITAR_DATA: Record<string, number[]> = {
  // C
  'C': [-1, 3, 2, 0, 1, 0], 'Cm': [-1, 3, 5, 5, 4, 3], 'C7': [-1, 3, 2, 3, 1, 0], 'Cmaj7': [-1, 3, 2, 0, 0, 0], 'Cm7': [-1, 3, 5, 3, 4, 3], 'Csus4': [-1, 3, 3, 0, 1, 1], 'Cdim': [-1, 3, 4, 2, 4, -1],
  // C# / Db
  'C#': [-1, 4, 6, 6, 6, 4], 'C#m': [-1, 4, 6, 6, 5, 4], 'C#7': [-1, 4, 3, 4, 2, -1], 'C#maj7': [-1, 4, 6, 5, 6, 4], 'C#m7': [-1, 4, 6, 4, 5, 4], 'C#sus4': [-1, 4, 6, 6, 7, 4], 'C#dim': [-1, 4, 5, 3, 5, -1],
  // D
  'D': [-1, -1, 0, 2, 3, 2], 'Dm': [-1, -1, 0, 2, 3, 1], 'D7': [-1, -1, 0, 2, 1, 2], 'Dmaj7': [-1, -1, 0, 2, 2, 2], 'Dm7': [-1, -1, 0, 2, 1, 1], 'Dsus4': [-1, -1, 0, 2, 3, 3], 'Ddim': [-1, -1, 0, 1, 3, 1],
  // Eb / D#
  'Eb': [-1, 6, 5, 3, 4, 3], 'Ebm': [-1, 6, 8, 8, 7, 6], 'Eb7': [-1, 6, 5, 6, 4, -1], 'Ebmaj7': [-1, 6, 8, 7, 8, 6], 'Ebm7': [-1, 6, 8, 6, 7, 6], 'Ebsus4': [-1, 6, 6, 3, 4, 4], 'Ebdim': [-1, -1, 1, 2, 4, 2],
  // E
  'E': [0, 2, 2, 1, 0, 0], 'Em': [0, 2, 2, 0, 0, 0], 'E7': [0, 2, 0, 1, 0, 0], 'Emaj7': [0, 2, 1, 1, 0, 0], 'Em7': [0, 2, 2, 0, 3, 0], 'Esus4': [0, 2, 2, 2, 0, 0], 'Edim': [0, 1, 2, 0, 2, 0],
  // F
  'F': [1, 3, 3, 2, 1, 1], 'Fm': [1, 3, 3, 1, 1, 1], 'F7': [1, 3, 1, 2, 1, 1], 'Fmaj7': [-1, -1, 3, 2, 1, 0], 'Fm7': [1, 3, 1, 1, 1, 1], 'Fsus4': [1, 3, 3, 3, 1, 1], 'Fdim': [-1, -1, 0, 1, 0, 1],
  // F# / Gb
  'F#': [2, 4, 4, 3, 2, 2], 'F#m': [2, 4, 4, 2, 2, 2], 'F#7': [2, 4, 2, 3, 2, 2], 'F#maj7': [-1, -1, 4, 3, 2, 1], 'F#m7': [2, 4, 2, 2, 2, 2], 'F#sus4': [2, 4, 4, 4, 2, 2], 'F#dim': [2, -1, 1, 2, 1, -1],
  // G
  'G': [3, 2, 0, 0, 0, 3], 'Gm': [3, 5, 5, 3, 3, 3], 'G7': [3, 2, 0, 0, 0, 1], 'Gmaj7': [3, 2, 0, 0, 0, 2], 'Gm7': [3, 5, 3, 3, 3, 3], 'Gsus4': [3, 5, 5, 5, 3, 3], 'Gdim': [3, -1, 2, 3, 2, -1],
  // Ab / G#
  'Ab': [4, 6, 6, 5, 4, 4], 'Abm': [4, 6, 6, 4, 4, 4], 'Ab7': [4, 6, 4, 5, 4, 4], 'Abmaj7': [4, -1, 5, 5, 4, -1], 'Abm7': [4, 6, 4, 4, 4, 4], 'Absus4': [4, 6, 6, 6, 4, 4], 'Abdim': [4, -1, 3, 4, 3, -1],
  // A
  'A': [-1, 0, 2, 2, 2, 0], 'Am': [-1, 0, 2, 2, 1, 0], 'A7': [-1, 0, 2, 0, 2, 0], 'Amaj7': [-1, 0, 2, 1, 2, 0], 'Am7': [-1, 0, 2, 0, 1, 0], 'Asus4': [-1, 0, 2, 2, 3, 0], 'Adim': [-1, 0, 1, 2, 1, -1],
  // Bb / A#
  'Bb': [-1, 1, 3, 3, 3, 1], 'Bbm': [-1, 1, 3, 3, 2, 1], 'Bb7': [-1, 1, 3, 1, 3, 1], 'Bbmaj7': [-1, 1, 3, 2, 3, 1], 'Bbm7': [1, 1, 3, 1, 2, 1], 'Bbsus4': [-1, 1, 3, 3, 4, 1], 'Bbdim': [-1, 1, 2, 0, 2, -1],
  // B
  'B': [-1, 2, 4, 4, 4, 2], 'Bm': [-1, 2, 4, 4, 3, 2], 'B7': [-1, 2, 1, 2, 0, 2], 'Bmaj7': [-1, 2, 4, 3, 4, 2], 'Bm7': [-1, 2, 4, 2, 3, 2], 'Bsus4': [-1, 2, 4, 4, 5, 2], 'Bdim': [-1, 2, 3, 1, 3, -1],
};

const UKULELE_DATA: Record<string, number[]> = {
  'C': [0, 0, 0, 3], 'Cm': [0, 3, 3, 3], 'C7': [0, 0, 0, 1], 'Cmaj7': [0, 0, 0, 2], 'Cm7': [3, 3, 3, 3], 'Csus4': [0, 0, 1, 3], 'Cdim': [2, 3, 2, 3],
  'C#': [1, 1, 1, 4], 'C#m': [1, 4, 4, 4], 'C#7': [1, 1, 1, 2], 'C#maj7': [1, 1, 1, 3], 'C#m7': [4, 4, 4, 4], 'C#sus4': [1, 1, 2, 4], 'C#dim': [0, 1, 0, 1],
  'D': [2, 2, 2, 0], 'Dm': [2, 2, 1, 0], 'D7': [2, 2, 2, 3], 'Dmaj7': [2, 2, 2, 4], 'Dm7': [2, 2, 1, 3], 'Dsus4': [0, 2, 3, 0], 'Ddim': [1, 2, 1, 2],
  'Eb': [0, 3, 3, 1], 'Ebm': [3, 3, 2, 1], 'Eb7': [3, 3, 3, 4], 'Ebmaj7': [3, 3, 3, 5], 'Ebm7': [3, 3, 2, 4], 'Ebsus4': [1, 3, 4, 1], 'Ebdim': [2, 3, 2, 3],
  'E': [1, 4, 0, 2], 'Em': [0, 4, 3, 2], 'E7': [1, 2, 0, 2], 'Emaj7': [1, 3, 0, 2], 'Em7': [0, 2, 0, 2], 'Esus4': [2, 4, 0, 2], 'Edim': [0, 1, 0, 1],
  'F': [2, 0, 1, 0], 'Fm': [1, 0, 1, 3], 'F7': [2, 3, 1, 0], 'Fmaj7': [2, 4, 1, 0], 'Fm7': [1, 3, 1, 3], 'Fsus4': [3, 0, 1, 1], 'Fdim': [1, 2, 1, 2],
  'F#': [3, 1, 2, 1], 'F#m': [2, 1, 2, 0], 'F#7': [3, 4, 2, 1], 'F#maj7': [3, 5, 2, 1], 'F#m7': [2, 4, 2, 4], 'F#sus4': [4, 1, 2, 2], 'F#dim': [2, 3, 2, 3],
  'G': [0, 2, 3, 2], 'Gm': [0, 2, 3, 1], 'G7': [0, 2, 1, 2], 'Gmaj7': [0, 2, 2, 2], 'Gm7': [0, 2, 1, 1], 'Gsus4': [0, 2, 3, 3], 'Gdim': [0, 1, 0, 1],
  'Ab': [5, 3, 4, 3], 'Abm': [4, 3, 4, 2], 'Ab7': [1, 3, 2, 3], 'Abmaj7': [1, 3, 3, 3], 'Abm7': [1, 3, 2, 2], 'Absus4': [1, 3, 4, 4], 'Abdim': [1, 2, 1, 2],
  'A': [2, 1, 0, 0], 'Am': [2, 0, 0, 0], 'A7': [0, 1, 0, 0], 'Amaj7': [1, 1, 0, 0], 'Am7': [0, 0, 0, 0], 'Asus4': [2, 2, 0, 0], 'Adim': [2, 3, 2, 3],
  'Bb': [3, 2, 1, 1], 'Bbm': [3, 1, 1, 1], 'Bb7': [1, 2, 1, 1], 'Bbmaj7': [3, 2, 1, 0], 'Bbm7': [1, 1, 1, 1], 'Bbsus4': [3, 3, 1, 1], 'Bbdim': [0, 1, 0, 1],
  'B': [4, 3, 2, 2], 'Bm': [4, 2, 2, 2], 'B7': [2, 3, 2, 2], 'Bmaj7': [4, 3, 2, 1], 'Bm7': [2, 2, 2, 2], 'Bsus4': [4, 4, 2, 2], 'Bdim': [1, 2, 1, 2],
};

const ChordDictionary: React.FC = () => {
  const [instrument, setInstrument] = useState('Guitar');
  const [root, setRoot] = useState('C');
  const [quality, setQuality] = useState(QUALITIES[0]);

  const renderFretboard = (frets: number[], isUke = false) => {
    if (!frets) return <div className="text-slate-500 h-64 flex items-center justify-center">Chord diagram not available yet</div>;

    const numStrings = isUke ? 4 : 6;
    // Calculate if we need to shift the fretboard (e.g. for C#m at fret 4)
    // We ignore -1 (muted) and 0 (open) for this check
    const pressedFrets = frets.filter(f => f > 0);
    const minFret = pressedFrets.length > 0 ? Math.min(...pressedFrets) : 0;
    const baseFret = minFret > 1 ? minFret - 1 : 1;
    
    // Normalize frets to relative 0-5 scale for display
    const displayFrets = frets.map(f => (f > 0 && baseFret > 1) ? f - baseFret + 1 : f);

    const width = 200;
    const height = 240;
    const stringSpacing = width / (numStrings - 1);
    const fretSpacing = 40;
    const topMargin = 40;
    const sideMargin = 20;

    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${width + 60} ${height + 60}`} className="max-w-[300px] mx-auto">
        {/* Nut (only draw heavy line if we are at base fret 1) */}
        {baseFret === 1 && (
           <rect x={sideMargin} y={topMargin} width={width} height={8} className="fill-slate-800 dark:fill-slate-500" />
        )}

        {/* Frets */}
        {[0, 1, 2, 3, 4, 5].map(i => (
          <line 
            key={i} 
            x1={sideMargin} y1={topMargin + (i * fretSpacing)} 
            x2={sideMargin + width} y2={topMargin + (i * fretSpacing)} 
            className="stroke-slate-300 dark:stroke-slate-600" strokeWidth="2" 
          />
        ))}

        {/* Strings */}
        {Array.from({ length: numStrings }).map((_, i) => (
          <line 
            key={i} 
            x1={sideMargin + (i * stringSpacing)} y1={topMargin} 
            x2={sideMargin + (i * stringSpacing)} y2={topMargin + (5 * fretSpacing)} 
            className="stroke-slate-300 dark:stroke-slate-600" strokeWidth={i < 3 && !isUke ? 3 : 1} 
          />
        ))}

        {/* Base Fret Indicator */}
        {baseFret > 1 && (
           <text x={0} y={topMargin + 1.5 * fretSpacing} className="fill-slate-900 dark:fill-white font-bold text-sm">Fr.{baseFret}</text>
        )}

        {/* Dots */}
        {displayFrets.map((fret, stringIdx) => {
          const x = sideMargin + (stringIdx * stringSpacing);
          
          if (fret === -1) {
            return <text key={stringIdx} x={x} y={topMargin - 15} textAnchor="middle" className="fill-red-500" fontSize="20" fontWeight="bold">×</text>;
          } 
          if (fret === 0) {
            return <circle key={stringIdx} cx={x} cy={topMargin - 10} r="6" className="stroke-cyan-600 dark:stroke-cyan-400" strokeWidth="2" fill="none" />;
          }
          
          return (
            <React.Fragment key={stringIdx}>
              <circle 
                cx={x} 
                cy={topMargin + (fret * fretSpacing) - (fretSpacing / 2)} 
                r="14" 
                className="fill-cyan-600 dark:fill-cyan-400" 
              />
              <text 
                x={x} 
                y={topMargin + (fret * fretSpacing) - (fretSpacing / 2) + 5} 
                textAnchor="middle" 
                fill="white" 
                fontSize="12" 
                fontWeight="bold"
              >
                {/* Display absolute fret number logic inside the dot? No, usually fingers or blank. */}
                {/* We can show finger number if we had data, for now blank or generic */}
              </text>
            </React.Fragment>
          );
        })}
      </svg>
    );
  };

  const renderPiano = () => {
    const rootIndex = ROOTS.indexOf(root);
    const activeKeys = quality.pianoIntervals.map(interval => (rootIndex + interval) % 12);
    
    const whiteKeyWidth = 40;
    const blackKeyWidth = 24;
    const height = 160;

    let x = 0;
    const keyMap = [
      { note: 'C', isBlack: false }, { note: 'C#', isBlack: true },
      { note: 'D', isBlack: false }, { note: 'Eb', isBlack: true }, // Normalized to match ROOTS
      { note: 'E', isBlack: false },
      { note: 'F', isBlack: false }, { note: 'F#', isBlack: true },
      { note: 'G', isBlack: false }, { note: 'Ab', isBlack: true },
      { note: 'A', isBlack: false }, { note: 'Bb', isBlack: true },
      { note: 'B', isBlack: false },
      { note: 'C', isBlack: false }, { note: 'C#', isBlack: true }, 
      { note: 'D', isBlack: false }, { note: 'Eb', isBlack: true },
      { note: 'E', isBlack: false },
    ];

    let whiteIndex = 0;
    const whiteKeysRender = keyMap.map((k, i) => {
      if (k.isBlack) return null;
      const currentNoteIndex = i % 12;
      const isActive = activeKeys.includes(currentNoteIndex);
      const el = (
        <rect 
          key={i}
          x={whiteIndex * whiteKeyWidth} y={0} 
          width={whiteKeyWidth} height={height} 
          fill={isActive ? '#22d3ee' : 'white'} 
          className="stroke-slate-300 dark:stroke-slate-600"
          rx="4"
        />
      );
      whiteIndex++;
      return el;
    });

    whiteIndex = 0;
    const blackKeysRender = keyMap.map((k, i) => {
      if (!k.isBlack) {
        whiteIndex++;
        return null;
      }
      const currentNoteIndex = i % 12;
      const isActive = activeKeys.includes(currentNoteIndex);
      return (
        <rect 
          key={i}
          x={(whiteIndex * whiteKeyWidth) - (blackKeyWidth / 2)} y={0} 
          width={blackKeyWidth} height={height * 0.6} 
          fill={isActive ? '#0ea5e9' : '#1e293b'} 
          rx="2"
        />
      );
    });

    return (
      <svg width="100%" height={height + 20} viewBox={`0 0 ${whiteIndex * whiteKeyWidth} ${height}`} className="max-w-[500px] mx-auto mt-8">
        {whiteKeysRender}
        {blackKeysRender}
        <circle cx={15} cy={height - 20} r="4" fill="#ef4444" opacity={0.5} />
        <text x={25} y={height - 15} fontSize="10" className="fill-slate-500">C</text>
      </svg>
    );
  };

  const getChordData = () => {
    const chordName = `${root}${quality.suffix}`;
    if (instrument === 'Guitar') return GUITAR_DATA[chordName] || null;
    if (instrument === 'Ukulele') return UKULELE_DATA[chordName] || null;
    return null;
  };

  const chordData = getChordData();

  return (
    <div className="max-w-4xl mx-auto pb-20 p-6">
      <div className="mb-8 border-b border-slate-200 dark:border-slate-800 pb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
          <Grid3X3 className="text-cyan-600 dark:text-cyan-500" /> Chord Dictionary
        </h1>
        <p className="text-slate-500 dark:text-slate-400">Visual reference for Guitar, Ukulele and Piano chords.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 mb-8 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Instrument</label>
            <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
              {INSTRUMENTS.map(inst => (
                <button
                  key={inst}
                  onClick={() => setInstrument(inst)}
                  className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${
                    instrument === inst 
                      ? 'bg-cyan-600 text-white shadow' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-white'
                  }`}
                >
                  {inst}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Root Note</label>
            <select
              value={root}
              onChange={(e) => setRoot(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-bold text-lg"
            >
              {ROOTS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Quality</label>
            <select
              value={JSON.stringify(quality)}
              onChange={(e) => setQuality(JSON.parse(e.target.value))}
              className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-bold text-lg"
            >
              {QUALITIES.map(q => (
                <option key={q.label} value={JSON.stringify(q)}>{q.label} ({root}{q.suffix})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[400px] shadow-sm">
        <div className="mb-8 text-center">
          <h2 className="text-5xl font-bold text-slate-900 dark:text-white mb-2">{root}<span className="text-cyan-600 dark:text-cyan-400">{quality.suffix}</span></h2>
          <p className="text-slate-500 dark:text-slate-500">{instrument} • {quality.label}</p>
        </div>

        <div className="bg-white dark:bg-white rounded-xl p-6 shadow-2xl shadow-cyan-900/10 w-full max-w-lg border border-slate-100 dark:border-none">
           {instrument === 'Piano' ? renderPiano() : renderFretboard(chordData || [], instrument === 'Ukulele')}
        </div>

        {instrument !== 'Piano' && !chordData && (
          <div className="mt-6 text-yellow-600 dark:text-yellow-500 text-sm flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/20 px-4 py-2 rounded-lg border border-yellow-200 dark:border-yellow-900/50">
             Diagram missing for this specific chord variation.
          </div>
        )}
      </div>
    </div>
  );
};

export default ChordDictionary;
