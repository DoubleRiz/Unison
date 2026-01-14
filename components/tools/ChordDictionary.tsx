
import React, { useState } from 'react';
import { Grid3X3 } from 'lucide-react';
import ChordVisualizer from '../ChordVisualizer';
import { GUITAR_DATA, UKULELE_DATA } from '../../constants/chordShapes';

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

const ChordDictionary: React.FC = () => {
  const [instrument, setInstrument] = useState('Guitar');
  const [root, setRoot] = useState('C');
  const [quality, setQuality] = useState(QUALITIES[0]);

  const renderPiano = () => {
    const rootIndex = ROOTS.indexOf(root);
    const activeKeys = quality.pianoIntervals.map(interval => (rootIndex + interval) % 12);
    
    const whiteKeyWidth = 40;
    const blackKeyWidth = 24;
    const height = 160;

    const keyMap = [
      { note: 'C', isBlack: false }, { note: 'C#', isBlack: true },
      { note: 'D', isBlack: false }, { note: 'Eb', isBlack: true }, 
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
           {instrument === 'Piano' ? renderPiano() : (
             <ChordVisualizer 
                frets={chordData || []} 
                isUke={instrument === 'Ukulele'} 
                size={240} 
             />
           )}
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
