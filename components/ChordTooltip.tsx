
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ChordVisualizer from './ChordVisualizer';
import { GUITAR_DATA, UKULELE_DATA } from '../constants/chordShapes';

interface ChordTooltipProps {
  chord: string;
  children: React.ReactNode;
}

const ChordTooltip: React.FC<ChordTooltipProps> = ({ chord, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [instrument, setInstrument] = useState<'guitar' | 'ukulele'>('guitar');
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);

  const baseChord = chord.split('/')[0];
  const guitarFrets = GUITAR_DATA[baseChord];
  const ukeFrets = UKULELE_DATA[baseChord];

  const hasShape = instrument === 'guitar' ? !!guitarFrets : !!ukeFrets;
  const currentFrets = instrument === 'guitar' ? guitarFrets : ukeFrets;

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = 160;
    const padding = 16;

    let left = rect.left + rect.width / 2 - tooltipWidth / 2;
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));

    setPosition({
      top: rect.top + window.scrollY - 8, // will be shifted up via transform
      left,
    });
  };

  const show = () => {
    updatePosition();
    setIsVisible(true);
  };

  const hide = () => setIsVisible(false);

  // Close on scroll
  useEffect(() => {
    if (!isVisible) return;
    const onScroll = () => hide();
    window.addEventListener('scroll', onScroll, true);
    return () => window.removeEventListener('scroll', onScroll, true);
  }, [isVisible]);

  const tooltip = isVisible ? (
    <div
      onMouseEnter={show}
      onMouseLeave={hide}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        transform: 'translateY(-100%)',
        zIndex: 9999,
      }}
      className="pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      <div className="bg-slate-900 dark:bg-slate-800 border border-slate-700 dark:border-slate-600 rounded-xl p-3 shadow-2xl min-w-[140px]">
        <div className="flex justify-between items-center mb-2 border-b border-slate-800 dark:border-slate-700 pb-1">
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
        </div>

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

        {/* Arrow */}
        <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-8 border-transparent border-t-slate-900 dark:border-t-slate-800"></span>
      </div>
    </div>
  ) : null;

  return (
    <span
      ref={triggerRef}
      className="relative inline-block"
      onMouseEnter={show}
      onMouseLeave={hide}
      onClick={(e) => {
        e.stopPropagation();
        isVisible ? hide() : show();
      }}
    >
      {children}
      {typeof document !== 'undefined' && createPortal(tooltip, document.body)}
    </span>
  );
};

export default ChordTooltip;
