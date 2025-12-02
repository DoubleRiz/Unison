
import React from 'react';
import { BookOpen, Music, Users, List, Play, Edit3, Type, Hash, ShieldQuestion, ChevronLeft } from 'lucide-react';

interface HelpPageProps {
  onBack: () => void;
}

const HelpPage: React.FC<HelpPageProps> = ({ onBack }) => {
  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="mb-8 border-b border-slate-800 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <BookOpen className="text-cyan-500" /> Help & Tutorials
          </h1>
          <p className="text-slate-400">Master ChordCraft with these guides.</p>
        </div>
        <button onClick={onBack} className="text-slate-400 hover:text-white flex items-center gap-2">
            <ChevronLeft size={20} /> Back
        </button>
      </div>

      <div className="space-y-12">
        {/* 1. Writing Songs */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-cyan-900/30 text-cyan-400 rounded-lg">
              <Edit3 size={24} />
            </div>
            <h2 className="text-2xl font-bold text-white">Writing Songs</h2>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <p className="text-slate-300 mb-4">
              ChordCraft uses a simple <strong>ChordPro-like</strong> format. To verify that your song works with the transposition engine, enclose your chords in square brackets.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-sm">
                <div className="text-slate-500 mb-2 border-b border-slate-800 pb-2">Input (Editor)</div>
                <div className="text-white">
                  [Intro]<br/>
                  [C]     [G]<br/>
                  <br/>
                  [Verse 1]<br/>
                  [C]                [G]<br/>
                  This is how you write a song<br/>
                  [Am]             [F]<br/>
                  With sections clearly marked
                </div>
              </div>
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-sm">
                <div className="text-slate-500 mb-2 border-b border-slate-800 pb-2">Output (Result)</div>
                <div className="mb-4">
                   <span className="inline-block px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-400 text-[10px] font-bold uppercase tracking-widest">
                     INTRO
                   </span>
                </div>
                <div className="flex mb-4">
                   <span className="text-cyan-400 font-bold mr-4">C</span>
                   <span className="text-cyan-400 font-bold">G</span>
                </div>
                <div className="mb-2">
                   <span className="inline-block px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-400 text-[10px] font-bold uppercase tracking-widest">
                     VERSE 1
                   </span>
                </div>
                <div className="flex flex-col">
                   <div className="text-cyan-400 font-bold text-xs">C</div>
                   <div className="text-slate-300">This is how you write a song</div>
                </div>
              </div>
            </div>

            <ul className="list-disc list-inside mt-4 text-slate-400 text-sm space-y-1">
              <li>Use <code>[Bracket]</code> notation for all chords: <code>[Am7]</code>, <code>[C/G]</code>, <code>[D#dim]</code>.</li>
              <li>Use <code>[Chorus]</code>, <code>[Verse]</code>, <code>[Bridge]</code> to create styled section headers.</li>
              <li>Align chords over lyrics using spaces. The editor uses a monospace font to help you align them perfectly.</li>
            </ul>
          </div>
        </section>

        {/* 2. Notation Modes */}
        <section>
           <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-900/30 text-purple-400 rounded-lg">
              <Hash size={24} />
            </div>
            <h2 className="text-2xl font-bold text-white">Transposition & Degrees</h2>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <p className="text-slate-300 mb-4">
              ChordCraft understands music theory. You can switch between standard letter notation and Nashville Number System (Degrees) instantly.
            </p>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                   <h4 className="font-bold text-white mb-2 flex items-center gap-2"><Type size={16}/> Standard</h4>
                   <p className="text-sm text-slate-400 mb-2">Key of C</p>
                   <div className="text-cyan-400 font-bold text-xl">C  -  Am  -  F  -  G</div>
                </div>
                <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                   <h4 className="font-bold text-white mb-2 flex items-center gap-2"><Hash size={16}/> Degrees</h4>
                   <p className="text-sm text-slate-400 mb-2">Universal</p>
                   <div className="flex gap-4 font-bold text-xl">
                      <span><span className="text-fuchsia-400">1</span></span>
                      <span><span className="text-fuchsia-400">6</span><span className="text-cyan-400">m</span></span>
                      <span><span className="text-fuchsia-400">4</span></span>
                      <span><span className="text-fuchsia-400">5</span></span>
                   </div>
                </div>
             </div>
          </div>
        </section>

        {/* 3. Groups & Setlists */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
               <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-900/30 text-blue-400 rounded-lg">
                  <Users size={24} />
                </div>
                <h2 className="text-2xl font-bold text-white">Groups</h2>
              </div>
              <p className="text-slate-400 text-sm mb-4">
                Create a band group and invite members by their username. 
                When editing a song, you can choose to <strong>"Allow Group Editing"</strong>. 
                This lets any member of that group modify the song details.
              </p>
            </div>
            <div>
               <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-900/30 text-green-400 rounded-lg">
                  <List size={24} />
                </div>
                <h2 className="text-2xl font-bold text-white">Setlists</h2>
              </div>
              <p className="text-slate-400 text-sm mb-4">
                Drag and drop songs to create the perfect flow. 
                You can change the key of a song <strong>specifically for a setlist</strong> without affecting the original version in your library.
              </p>
            </div>
          </div>
        </section>

         {/* 4. Performance Mode */}
        <section>
           <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-900/30 text-red-400 rounded-lg">
              <Play size={24} />
            </div>
            <h2 className="text-2xl font-bold text-white">Performance Mode</h2>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
             <p className="text-slate-300 mb-2">
               Inside a Setlist, click the green <strong>Perform</strong> button.
             </p>
             <ul className="list-disc list-inside text-slate-400 text-sm space-y-2">
                <li>Full screen view optimized for stage.</li>
                <li>Large navigation buttons to switch songs.</li>
                <li>Prevents screen sleep (on supported devices).</li>
                <li>Access to Transpose and Notation toggles on the fly.</li>
             </ul>
          </div>
        </section>

      </div>
    </div>
  );
};

export default HelpPage;
