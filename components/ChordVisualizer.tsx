
import React from 'react';

interface ChordVisualizerProps {
  frets: number[];
  isUke?: boolean;
  size?: number;
  showLabels?: boolean;
}

const ChordVisualizer: React.FC<ChordVisualizerProps> = ({ 
  frets, 
  isUke = false, 
  size = 120,
  showLabels = false
}) => {
  const numStrings = isUke ? 4 : 6;
  const pressedFrets = frets.filter(f => f > 0);
  const minFret = pressedFrets.length > 0 ? Math.min(...pressedFrets) : 0;
  const baseFret = minFret > 1 ? minFret - 1 : 1;
  const displayFrets = frets.map(f => (f > 0 && baseFret > 1) ? f - baseFret + 1 : f);

  const width = 100;
  const height = 120;
  const stringSpacing = width / (numStrings - 1);
  const fretSpacing = 20;
  const topMargin = 20;
  const sideMargin = 10;

  return (
    <svg width={size} height={size * 1.2} viewBox={`0 0 ${width + 20} ${height + 20}`} className="mx-auto">
      {/* Nut */}
      {baseFret === 1 && (
        <rect x={sideMargin} y={topMargin} width={width} height={4} className="fill-slate-800 dark:fill-slate-400" />
      )}

      {/* Frets */}
      {[0, 1, 2, 3, 4, 5].map(i => (
        <line 
          key={i} 
          x1={sideMargin} y1={topMargin + (i * fretSpacing)} 
          x2={sideMargin + width} y2={topMargin + (i * fretSpacing)} 
          className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="1" 
        />
      ))}

      {/* Strings */}
      {Array.from({ length: numStrings }).map((_, i) => (
        <line 
          key={i} 
          x1={sideMargin + (i * stringSpacing)} y1={topMargin} 
          x2={sideMargin + (i * stringSpacing)} y2={topMargin + (5 * fretSpacing)} 
          className="stroke-slate-200 dark:stroke-slate-700" strokeWidth={i < 3 && !isUke ? 1.5 : 0.8} 
        />
      ))}

      {/* Base Fret Indicator */}
      {baseFret > 1 && (
        <text x={0} y={topMargin + 1.2 * fretSpacing} className="fill-slate-500 dark:fill-slate-400 font-bold text-[8px]">Fr.{baseFret}</text>
      )}

      {/* Dots */}
      {displayFrets.map((fret, stringIdx) => {
        const x = sideMargin + (stringIdx * stringSpacing);
        
        if (fret === -1) {
          return <text key={stringIdx} x={x} y={topMargin - 5} textAnchor="middle" className="fill-red-500" fontSize="10" fontWeight="bold">×</text>;
        } 
        if (fret === 0) {
          return <circle key={stringIdx} cx={x} cy={topMargin - 5} r="3" className="stroke-cyan-500 dark:stroke-cyan-400" strokeWidth="1" fill="none" />;
        }
        
        return (
          <circle 
            key={stringIdx}
            cx={x} 
            cy={topMargin + (fret * fretSpacing) - (fretSpacing / 2)} 
            r="4" 
            className="fill-cyan-600 dark:fill-cyan-400" 
          />
        );
      })}
    </svg>
  );
};

export default ChordVisualizer;
