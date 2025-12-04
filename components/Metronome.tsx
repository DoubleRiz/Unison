import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Activity } from 'lucide-react';

interface MetronomeProps {
  initialBpm: number | null;
}

const Metronome: React.FC<MetronomeProps> = ({ initialBpm }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(initialBpm || 120);
  const [tick, setTick] = useState(false); // For visual feedback

  const audioContextRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef<number>(0);
  const timerIDRef = useRef<number | null>(null);
  const lookahead = 25.0; // How frequently to call scheduling function (in milliseconds)
  const scheduleAheadTime = 0.1; // How far ahead to schedule audio (sec)

  // Initialize Audio Context on user interaction (Play)
  const startMetronome = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    // Resume context if suspended (browser policy)
    if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
    }

    setIsPlaying(true);
    nextNoteTimeRef.current = audioContextRef.current.currentTime + 0.05;
    scheduler();
  };

  const stopMetronome = () => {
    setIsPlaying(false);
    if (timerIDRef.current) {
      window.clearTimeout(timerIDRef.current);
    }
  };

  const nextNote = () => {
    const secondsPerBeat = 60.0 / bpm;
    nextNoteTimeRef.current += secondsPerBeat;
    
    // Visual tick logic
    setTick(prev => !prev);
  };

  const playClick = (time: number) => {
    if (!audioContextRef.current) return;
    
    const osc = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);

    // High beep for accented beat (logic could be added for time signatures), here just standard click
    osc.frequency.value = 1000;
    
    gainNode.gain.value = 1;
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    osc.start(time);
    osc.stop(time + 0.05);
  };

  const scheduler = () => {
    if (!audioContextRef.current) return;

    // while there are notes that will need to play before the next interval, 
    // schedule them and advance the pointer.
    while (nextNoteTimeRef.current < audioContextRef.current.currentTime + scheduleAheadTime) {
      playClick(nextNoteTimeRef.current);
      nextNote();
    }
    
    if (isPlaying) {
      timerIDRef.current = window.setTimeout(scheduler, lookahead);
    }
  };

  // Handle Stop effect
  useEffect(() => {
    if (!isPlaying && timerIDRef.current) {
       window.clearTimeout(timerIDRef.current);
    }
    if (isPlaying && !timerIDRef.current) {
       scheduler();
    }
    return () => {
      if (timerIDRef.current) window.clearTimeout(timerIDRef.current);
    };
  }, [isPlaying]);

  return (
    <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1 pr-3 border border-slate-700">
      <button
        onClick={isPlaying ? stopMetronome : startMetronome}
        className={`p-1.5 rounded-md transition-all ${
          isPlaying 
            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
        }`}
        title={isPlaying ? "Stop Metronome" : "Start Metronome"}
      >
        {isPlaying ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
      </button>
      
      <div className="flex items-center gap-2 min-w-[80px]">
        <Activity size={14} className={isPlaying ? (tick ? "text-cyan-400" : "text-slate-600") : "text-slate-600"} />
        <input 
          type="number" 
          value={bpm} 
          onChange={(e) => setBpm(Math.max(30, Math.min(300, Number(e.target.value))))}
          className="bg-transparent text-sm font-mono w-10 text-center focus:outline-none text-white appearance-none"
        />
        <span className="text-[10px] text-slate-500 font-bold">BPM</span>
      </div>
    </div>
  );
};

export default Metronome;
