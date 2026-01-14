
import React, { useState, useRef, useEffect } from 'react';
import ChordVisualizer from './ChordVisualizer';
import { GUITAR_DATA, UKULELE_DATA } from '../constants/chordShapes';

interface ChordTooltipProps {
  chord: string;
  children: React.ReactNode;
}

const ChordTooltip: React.FC<ChordTooltipProps> = ({ chord, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [instrument, setInstrument] = useState<'guitar' | 'ukulele'>('guitar');
  const [horizontalOffset, setHorizontalOffset] = useState(0);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Parse chord to find its base shape (ignoring bass notes for now)
  const baseChord = chord.split('/')[0];
  const guitarFrets = GUITAR_DATA[baseChord];
  const ukeFrets = UKULELE_DATA[baseChord];

  const hasShape = instrument === 'guitar' ? !!guitarFrets : !!ukeFrets;
  const currentFrets = instrument === 'guitar' ? guitarFrets : ukeFrets;

  // Logic to prevent the tooltip from going off-screen
  useEffect(() => {
    if (isVisible && tooltipRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect();
      const padding = 16; // Safety margin from screen edge
      let offset = 0;

      if (rect.left < padding) {
        offset = padding - rect.left;
      } else if (rect.right > window.innerWidth - padding) {
        offset = window.innerWidth - padding - rect.right;
      }
      
      setHorizontalOffset(offset);
    } else {
      setHorizontalOffset(0);
    }
  }, [isVisible]);

  return (
    <span 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onClick={(e) => {
        e.stopPropagation();
        setIsVisible(!isVisible);
      }}
    >
      {children}
      
      {isVisible && (
        <span 
          ref={tooltipRef}
          style={{ 
            transform: `translateX(calc(-50% + ${horizontalOffset}px))`,
            left: '50%'
          }}
          className="absolute bottom-full mb-3 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-none"
        >
          <span className="block bg-slate-900 dark:bg-slate-800 border border-slate-700 dark:border-slate-600 rounded-xl p-3 shadow-2xl min-w-[140px] pointer-events-auto">
            <span className="flex justify-between items-center mb-2 border-b border-slate-800 dark:border-slate-700 pb-1">
              <span className="text-[10px] font-black text-white uppercase tracking-wider">{chord}</span>
              <span className="flex gap-1">
                <button 
                  onClick={(e) => { e.stopPropagation(); setInstrument('guitar'); }}
                  className={`w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-black transition-colors ${instrument === 'guitar' ? 'bg-cyan-600 text-white shadow-lg' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}
                >
                  GTR
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setInstrument('ukulele'); }}
                  className={`w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-black transition-colors ${instrument === 'ukulele' ? 'bg-cyan-600 text-white shadow-lg' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}
                >
                  UKE
                </button>
              </span>
            </span>

            {hasShape ? (
              <ChordVisualizer 
                frets={currentFrets || []} 
                isUke={instrument === 'ukulele'} 
                size={110} 
              />
            ) : (
              <span className="block py-4 text-[10px] text-slate-500 text-center italic">
                Diagram not found
              </span>
            )}
            
            {/* Arrow - Always stays centered relative to the chord, even if box shifts */}
            <span 
              style={{ left: `calc(50% - ${horizontalOffset}px)` }}
              className="absolute top-full -translate-x-1/2 -mt-[1px] border-8 border-transparent border-t-slate-900 dark:border-t-slate-800 transition-all duration-300"
            ></span>
          </span>
        </span>
      )}
    </span>
  );
};

export default ChordTooltip;
