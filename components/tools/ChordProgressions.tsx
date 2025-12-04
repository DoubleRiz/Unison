
import React, { useState, useMemo } from 'react';
import { Music, ArrowRight, Dices, Filter, X, Zap, Maximize2, Search, BookOpen } from 'lucide-react';
import { transpose } from '../../utils/musicLogic';

interface Progression {
  name: string;
  roman: string[];
  description: string;
  mood: string;
  genre: string;
}

const PROGRESSIONS: Progression[] = [
  // --- POP / ROCK / RADIO ---
  {
    name: 'The "Axis of Awesome"',
    roman: ['I', 'V', 'vi', 'IV'],
    description: 'The ubiquitous 4-chord loop used in thousands of pop songs (Journey, Beatles, Adele).',
    mood: 'Catchy',
    genre: 'Pop'
  },
  {
    name: 'Sensitive Female Chord Prog.',
    roman: ['vi', 'IV', 'I', 'V'],
    description: 'A more emotional variation of the Axis. "Complicated", "One of Us", "Africa".',
    mood: 'Emotional',
    genre: 'Pop'
  },
  {
    name: 'Doo-Wop / 50s Ballad',
    roman: ['I', 'vi', 'IV', 'V'],
    description: 'Classic ballad progression. Very nostalgic and sweet. "Stand By Me", "Unchained Melody".',
    mood: 'Nostalgic',
    genre: 'Oldies'
  },
  {
    name: 'Mixolydian Rock',
    roman: ['I', 'bVII', 'IV'],
    description: 'Classic rock sound (AC/DC, Guns N Roses). The Flat 7 gives it a rebellious edge.',
    mood: 'Energetic',
    genre: 'Rock'
  },
  {
    name: 'The "Creep" Progression',
    roman: ['I', 'III', 'IV', 'iv'],
    description: 'Major to Major III, then Major IV to minor iv. The minor iv is the "heartbreak" chord.',
    mood: 'Sad',
    genre: 'Alt-Rock'
  },
  {
    name: 'Minor Plagal (Beatles)',
    roman: ['I', 'iv', 'I'],
    description: 'Resolving from the minor 4 chord to the Major 1. "In My Life", "Blackbird".',
    mood: 'Nostalgic',
    genre: 'Pop'
  },
  {
    name: 'San Francisco (Sf)',
    roman: ['vi', 'bVI', 'bIII', 'bVII'],
    description: 'Descending chromatic bass movement. "Boulevard of Broken Dreams", "Wonderwall" (variations).',
    mood: 'Melancholic',
    genre: 'Rock'
  },
  {
    name: 'Wonderwall Style',
    roman: ['vi7', 'IVadd9', 'I', 'V'],
    description: 'Drone notes on top create a rich texture. Keeps the tension resolving nicely.',
    mood: 'Acoustic',
    genre: 'Pop'
  },
  {
    name: 'Pop Punk Anthem',
    roman: ['I', 'V', 'vi', 'IV'],
    description: 'Fast tempo required. Blink-182, Green Day. High energy.',
    mood: 'Energetic',
    genre: 'Punk'
  },
  {
    name: 'The "Police" Progression',
    roman: ['IVadd9', 'I', 'IVadd9', 'I'],
    description: 'Simple implementation of add9 chords creating a floating atmosphere. "Every Breath You Take".',
    mood: 'Dreamy',
    genre: 'Pop'
  },
  {
    name: 'Use of the bVII',
    roman: ['I', 'bVII', 'IV', 'I'],
    description: 'Adding a mixolydian flavor to a standard progression. "Sweet Home Alabama".',
    mood: 'Southern',
    genre: 'Rock'
  },
  {
    name: 'Power Ballad 80s',
    roman: ['I', 'V', 'vi', 'iii', 'IV', 'I', 'IV', 'V'],
    description: 'Extended version of Pachelbel used in epic ballads.',
    mood: 'Epic',
    genre: 'Rock'
  },

  // --- JAZZ / SOUL / R&B / FUNK ---
  {
    name: 'Jazz ii-V-I (Major)',
    roman: ['ii7', 'V7', 'Imaj7'],
    description: 'The cornerstone of Jazz harmony. Creates a strong, smooth pull towards the root.',
    mood: 'Smooth',
    genre: 'Jazz'
  },
  {
    name: 'Jazz ii-V-i (Minor)',
    roman: ['ii7b5', 'V7alt', 'im7'],
    description: 'The dark, moody cousin of the standard 2-5-1. Essential for minor jazz standards.',
    mood: 'Moody',
    genre: 'Jazz'
  },
  {
    name: 'Rhythm Changes (A Section)',
    roman: ['Imaj7', 'vi7', 'ii7', 'V7'],
    description: 'The foundation of "I Got Rhythm". Used in countless Swing and Bebop tunes.',
    mood: 'Happy',
    genre: 'Jazz'
  },
  {
    name: 'The "Backdoor" Cadence',
    roman: ['ii7', 'bVII7', 'Imaj7'],
    description: 'Resolves to the 1 from the Flat 7 Dominant. A soulful alternative to V7-I.',
    mood: 'Soulful',
    genre: 'Jazz'
  },
  {
    name: 'Tritone Substitution',
    roman: ['ii7', 'bII7', 'Imaj7'],
    description: 'Replacing the V7 with a chord a tritone away (bII7). Chromatic bass movement.',
    mood: 'Sophisticated',
    genre: 'Jazz'
  },
  {
    name: 'R&B Neo-Soul Descension',
    roman: ['IVmaj7', 'iii7', 'ii7', 'Imaj7'],
    description: 'Walking down the scale with 7th chords. Very smooth, laid back, and sexy.',
    mood: 'Chill',
    genre: 'R&B'
  },
  {
    name: 'Neo-Soul Slide',
    roman: ['im9', 'bviim9', 'bvim9', 'v7'],
    description: 'Parallel minor 9th chords sliding down. Very common in modern R&B / Lo-Fi.',
    mood: 'Vibey',
    genre: 'R&B'
  },
  {
    name: 'Lo-Fi Hip Hop Loop',
    roman: ['ii9', 'V13', 'Imaj9', 'vi7'],
    description: 'Extended chords (9ths, 13ths) typical of chill beats and study music.',
    mood: 'Relaxed',
    genre: 'Lo-Fi'
  },
  {
    name: 'Coltrane Changes (Simplified)',
    roman: ['Imaj7', 'bIII7', 'bVImaj7', 'bVII7'],
    description: 'Moving by major thirds. Creates a disorienting but beautiful harmonic movement.',
    mood: 'Complex',
    genre: 'Jazz'
  },
  {
    name: 'Funk Groove 1',
    roman: ['i7', 'IV7'],
    description: 'The James Brown vamp. Staying on the one, hitting the four. Simple but effective.',
    mood: 'Funky',
    genre: 'Funk'
  },
  {
    name: 'Funk Groove 2',
    roman: ['i7', 'bVII', 'IV/VI', 'bVII'],
    description: 'More movement, typical of 70s disco/funk lines.',
    mood: 'Groovy',
    genre: 'Funk'
  },
  {
    name: 'The "Isn\'t She Lovely"',
    roman: ['vi7', 'II7', 'ii7', 'V7', 'I'],
    description: 'Uses a secondary dominant (II7) to create a bright, lifting feeling.',
    mood: 'Happy',
    genre: 'R&B'
  },
  {
    name: 'Minor 11th Vibe',
    roman: ['im11', 'bVImaj7', 'bVIIadd9'],
    description: 'Modern R&B/Trapsoul texture using open voicings.',
    mood: 'Deep',
    genre: 'R&B'
  },

  // --- GOSPEL / WORSHIP ---
  {
    name: 'Gospel Turnaround',
    roman: ['I', 'IV/I', 'I', 'V7sus4', 'V7'],
    description: 'Classic church ending or transition. Uses pedal points and suspended chords.',
    mood: 'Uplifting',
    genre: 'Gospel'
  },
  {
    name: 'Gospel Walk Up',
    roman: ['I', 'ii7', 'iii7', 'IVmaj7'],
    description: 'Rising bassline building tension and excitement.',
    mood: 'Uplifting',
    genre: 'Gospel'
  },
  {
    name: 'Preacher Chord (Dominant)',
    roman: ['I', 'IV', 'I', 'V7#9'],
    description: 'The sharp 9 chord adds that bluesy, gritty gospel tension.',
    mood: 'Intense',
    genre: 'Gospel'
  },
  {
    name: 'Worship Anthem',
    roman: ['vi', 'IV', 'I', 'V'],
    description: 'Standard modern worship flow. Builds emotional momentum.',
    mood: 'Spiritual',
    genre: 'Worship'
  },
  {
    name: 'Hymn Standard',
    roman: ['I', 'V', 'IV', 'I'],
    description: 'Traditional hymn structure. "Amazing Grace".',
    mood: 'Traditional',
    genre: 'Worship'
  },

  // --- CLASSICAL / CINEMATIC / WORLD ---
  {
    name: 'Pachelbel\'s Canon',
    roman: ['I', 'V', 'vi', 'iii', 'IV', 'I', 'IV', 'V'],
    description: 'The most famous classical progression. Basis for "Memories", "Basket Case".',
    mood: 'Regal',
    genre: 'Classical'
  },
  {
    name: 'La Folia',
    roman: ['i', 'V7', 'i', 'bVII', 'bIII', 'bVII', 'i', 'V7'],
    description: 'One of the oldest documented chord progressions in European music.',
    mood: 'Ancient',
    genre: 'Classical'
  },
  {
    name: 'Epic Hollywood',
    roman: ['vi', 'IV', 'I', 'V'],
    description: 'Used in many movie trailers (Hans Zimmer style). Similar to Pop but phrased dramatically.',
    mood: 'Epic',
    genre: 'Cinematic'
  },
  {
    name: 'Space / Lydian II',
    roman: ['I', 'II'],
    description: 'The Major II chord creates a floating, magical Lydian feeling. "E.T.", "Simpsons Theme".',
    mood: 'Dreamy',
    genre: 'Cinematic'
  },
  {
    name: 'Heroic Cadence',
    roman: ['bVI', 'bVII', 'I'],
    description: 'The "Mario" victory fanfare. climbing whole steps to resolution.',
    mood: 'Heroic',
    genre: 'Cinematic'
  },
  {
    name: 'Villain Theme',
    roman: ['im', 'bvm'],
    description: 'Moving a minor chord a tritone away creates instability and fear.',
    mood: 'Evil',
    genre: 'Cinematic'
  },
  {
    name: 'Andalusian Cadence',
    roman: ['im', 'bVII', 'bVI', 'V7'],
    description: 'Descending minor progression. Flamenco, "Hit the Road Jack", dramatic tension.',
    mood: 'Dramatic',
    genre: 'World'
  },
  {
    name: 'Phrygian Vamp',
    roman: ['im', 'bII'],
    description: 'Dark, tense oscillation. Common in Metal and Spanish music.',
    mood: 'Dark',
    genre: 'World'
  },
  {
    name: 'Bossa Nova Cliché',
    roman: ['im7', 'ii7b5', 'V7alt'],
    description: 'Standard minor turnaround for Bossa Nova rhythms.',
    mood: 'Relaxed',
    genre: 'Latin'
  },
  {
    name: 'Latin Montuno',
    roman: ['im', 'IV', 'V', 'IV'],
    description: 'Common backing track for salsa piano solos.',
    mood: 'Dancing',
    genre: 'Latin'
  },

  // --- JAPANESE / ANIME ---
  {
    name: 'Royal Road (Oudou Shinkou)',
    roman: ['IVmaj7', 'V7', 'iii7', 'vi'],
    description: 'The gold standard of J-Pop and Anime intros. Uplifting with a touch of longing.',
    mood: 'Uplifting',
    genre: 'J-Pop'
  },
  {
    name: 'Just The Two of Us (J-Pop Var)',
    roman: ['IVmaj7', 'III7', 'vi7', 'I7'],
    description: 'Extremely popular in City Pop and Anime endings. Stylish and emotional.',
    mood: 'Stylish',
    genre: 'J-Pop'
  },
  {
    name: 'Komuro Progression',
    roman: ['vi', 'IV', 'V', 'I'],
    description: 'Made famous by Tetsuya Komuro in the 90s. "Get Wild".',
    mood: 'Determined',
    genre: 'J-Pop'
  },
  {
    name: 'Tanaka Progression',
    roman: ['IV', 'V', 'I', 'vi'],
    description: 'A variation of Royal Road that resolves to tonic earlier.',
    mood: 'Hopeful',
    genre: 'J-Pop'
  },

  // --- BLUES / COUNTRY / FOLK ---
  {
    name: 'Blues 12-Bar (Standard)',
    roman: ['I7', 'I7', 'I7', 'I7', 'IV7', 'IV7', 'I7', 'I7', 'V7', 'IV7', 'I7', 'V7'],
    description: 'The standard blues structure using dominant 7th chords throughout.',
    mood: 'Gritty',
    genre: 'Blues'
  },
  {
    name: 'Slow Blues / 6/8',
    roman: ['I7', 'IV7', 'I7', 'I7', 'IV7', 'IV7', 'I7', 'I7', 'V7', 'IV7', 'I7', 'V7'],
    description: 'Similar to standard, but often played with a quick change to IV in the second bar.',
    mood: 'Soulful',
    genre: 'Blues'
  },
  {
    name: 'Jazz Blues',
    roman: ['I7', 'IV7', 'I7', 'I7', 'IV7', '#IVdim7', 'I7', 'VI7', 'ii7', 'V7', 'I7', 'V7'],
    description: 'Adds a diminished passing chord and a 2-5 turnaround.',
    mood: 'Jazzy',
    genre: 'Blues'
  },
  {
    name: 'Minor Blues',
    roman: ['im7', 'ivm7', 'im7', 'V7alt'],
    description: 'B.B. King style. "The Thrill Is Gone".',
    mood: 'Sad',
    genre: 'Blues'
  },
  {
    name: 'Dorian Vamp',
    roman: ['im7', 'IV7'],
    description: 'Two chords back and forth. Santana / Pink Floyd "Breathe". Groovy and jam-friendly.',
    mood: 'Groovy',
    genre: 'Rock'
  },
  {
    name: 'Secondary Dominant (V/V)',
    roman: ['I', 'II7', 'V7', 'I'],
    description: 'The II7 is a secondary dominant leading to V. "Hey Good Lookin".',
    mood: 'Country',
    genre: 'Country'
  },
  {
    name: 'Folk Standard',
    roman: ['I', 'V', 'IV', 'I'],
    description: 'Bob Dylan, Neil Young style.',
    mood: 'Earthy',
    genre: 'Folk'
  },

  // --- VIDEO GAMES / FANTASY ---
  {
    name: 'Lost Woods / Mystery',
    roman: ['I', 'vi', 'ii', 'V'],
    description: 'Looping, slightly mysterious but friendly. Zelda style.',
    mood: 'Mysterious',
    genre: 'Game'
  },
  {
    name: 'Battle Theme (Orchestral)',
    roman: ['im', 'bVI', 'bII', 'V'],
    description: 'High tension, dramatic movement.',
    mood: 'Aggressive',
    genre: 'Game'
  },
  {
    name: 'Underwater Level',
    roman: ['Imaj7', 'bVImaj7'],
    description: 'Chromatic mediant movement creates a submerged feeling.',
    mood: 'Calm',
    genre: 'Game'
  },
  
  // --- TRANSITION / MISC ---
  {
    name: 'Minor Line Cliché',
    roman: ['im', 'im(maj7)', 'im7', 'im6'],
    description: 'Descending chromatic line inside a static minor chord. "Stairway to Heaven", "James Bond".',
    mood: 'Mysterious',
    genre: 'Transition'
  },
  {
    name: 'Major Line Cliché',
    roman: ['I', 'Imaj7', 'I7', 'IV'],
    description: 'Descending line inside major chord leading to the IV. "Something" (Beatles).',
    mood: 'Sweet',
    genre: 'Transition'
  },
  {
    name: 'Circle of Fifths',
    roman: ['vi7', 'ii7', 'V7', 'Imaj7', 'IVmaj7', 'vii7b5', 'III7', 'vi7'],
    description: 'Moves through the circle of fifths. "I Will Survive", "Fly Me To The Moon".',
    mood: 'Resolving',
    genre: 'Jazz'
  },
  {
    name: 'Picardy Third',
    roman: ['i', 'v', 'i', 'I'],
    description: 'Ending a minor piece with a Major chord. A ray of sunlight at the end.',
    mood: 'Hopeful',
    genre: 'Classical'
  },
  {
    name: 'Augmented Pivot',
    roman: ['I', 'I+', 'IV'],
    description: 'Using the augmented chord to pull strongly to the IV.',
    mood: 'Tense',
    genre: 'Transition'
  }
];

const KEYS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

const ChordProgressions: React.FC = () => {
  const [selectedKey, setSelectedKey] = useState('C');
  const [filterGenre, setFilterGenre] = useState('');
  const [filterMood, setFilterMood] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [focusedProgression, setFocusedProgression] = useState<Progression | null>(null);

  // Helper to convert Roman to Actual Chord while preserving extensions
  const getChordFromRoman = (roman: string, key: string) => {
    // 1. Extract the numeric part for calculation (I, II, iii, etc)
    // We remove common extensions to find the root interval
    let rootRoman = roman
      .replace('maj7', '')
      .replace('maj9', '')
      .replace('m7b5', '')
      .replace('sus4', '')
      .replace('sus2', '')
      .replace('dim7', '')
      .replace('dim', '')
      .replace('add9', '')
      .replace('aug', '')
      .replace('alt', '')
      .replace('13', '')
      .replace('11', '')
      .replace('9', '')
      .replace('7', '') // order matters, 7 last
      .replace('6', '')
      .replace('(maj7)', '')
      .replace('+', '')
      .replace('/I', '') // Slash chords basic handling
      .replace('/V', '')
      .replace('/VI', '');

    const numerals: Record<string, number> = {
      'I': 0, 'i': 0,
      'bII': 1, 'ii': 2, 'II': 2, 'II#': 2,
      'bIII': 3, 'iii': 4, 'III': 4,
      'IV': 5, 'iv': 5, '#IV': 6,
      'bV': 6, 'V': 7,
      'bVI': 8, 'vi': 9, 'VI': 9,
      'bVII': 10, 'vii': 11
    };
    
    // Handle special flats/sharps manually if regex failed to strip cleanly
    if (rootRoman.startsWith('bVII')) rootRoman = 'bVII';
    else if (rootRoman.startsWith('bVI')) rootRoman = 'bVI';
    else if (rootRoman.startsWith('bIII')) rootRoman = 'bIII';
    else if (rootRoman.startsWith('bII')) rootRoman = 'bII';
    else if (rootRoman.startsWith('#IV')) rootRoman = '#IV';
    else if (rootRoman.startsWith('im')) rootRoman = 'i'; // catch im(maj7) edge case
    
    const interval = numerals[rootRoman];
    
    if (interval === undefined) return '?';

    // 2. Transpose root note
    const chordRoot = transpose(key, interval);
    
    // 3. Re-assemble: Root + Quality + Original Extension
    // Determine major/minor from casing of the *original* roman numeral (first letter)
    let checkCase = roman;
    if (roman.startsWith('b') || roman.startsWith('#')) checkCase = roman.substring(1);
    
    const firstChar = checkCase.charAt(0);
    const isMinor = firstChar === firstChar.toLowerCase() && firstChar !== 'b'; 

    // Extract the extension we stripped earlier by removing the rootRoman from the original string
    // Simplified approach: Regex match the extension at the end
    const extensionMatch = roman.match(/^(b?#?[ivIV]+)(.*)$/);
    const extension = extensionMatch ? extensionMatch[2] : '';

    // If logic detected minor but roman didn't have explicit 'm', we add 'm' 
    // UNLESS the extension already handles quality (like 'dim', '°', '+')
    let qualitySuffix = '';
    if (isMinor && !extension.includes('dim') && !extension.includes('°') && !extension.includes('+')) {
      qualitySuffix = 'm';
    }

    return `${chordRoot}${qualitySuffix}${extension}`;
  };

  const uniqueGenres = useMemo(() => {
    return Array.from(new Set(PROGRESSIONS.map(p => p.genre))).sort();
  }, []);

  const uniqueMoods = useMemo(() => {
    return Array.from(new Set(PROGRESSIONS.map(p => p.mood))).sort();
  }, []);

  const filteredProgressions = useMemo(() => {
    return PROGRESSIONS.filter(p => {
      const matchGenre = filterGenre ? p.genre === filterGenre : true;
      const matchMood = filterMood ? p.mood === filterMood : true;
      const matchSearch = searchQuery 
        ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      return matchGenre && matchMood && matchSearch;
    });
  }, [filterGenre, filterMood, searchQuery]);

  const handleSurpriseMe = () => {
    const list = filteredProgressions.length > 0 ? filteredProgressions : PROGRESSIONS;
    const random = list[Math.floor(Math.random() * list.length)];
    setFocusedProgression(random);
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 p-6">
      <div className="mb-8 border-b border-slate-200 dark:border-slate-800 pb-6 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
            <BookOpen className="text-purple-600 dark:text-purple-500" /> Chord Progressions
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Compose faster with these proven harmonic formulas.</p>
        </div>

        <div className="flex flex-col md:flex-row flex-wrap items-center gap-3">
           {/* Key Selector */}
           <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm w-full md:w-auto">
             <span className="text-[10px] font-bold text-slate-500 uppercase px-2">Key</span>
             <select 
               value={selectedKey}
               onChange={(e) => setSelectedKey(e.target.value)}
               className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold py-1.5 px-3 rounded focus:outline-none focus:border-purple-500 flex-1 cursor-pointer"
             >
               {KEYS.map(k => <option key={k} value={k}>{k}</option>)}
             </select>
           </div>

            {/* Search Bar */}
           <div className="relative w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Search name or mood..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 placeholder:text-slate-400"
              />
           </div>

           {/* Filters */}
           <div className="flex items-center gap-2 w-full md:w-auto">
             <select 
               value={filterGenre}
               onChange={(e) => { setFilterGenre(e.target.value); }}
               className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500 flex-1 md:flex-none cursor-pointer"
             >
               <option value="">All Genres</option>
               {uniqueGenres.map(g => <option key={g} value={g}>{g}</option>)}
             </select>

             <select 
               value={filterMood}
               onChange={(e) => { setFilterMood(e.target.value); }}
               className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500 flex-1 md:flex-none cursor-pointer"
             >
               <option value="">All Moods</option>
               {uniqueMoods.map(m => <option key={m} value={m}>{m}</option>)}
             </select>
           </div>

           <button 
             onClick={handleSurpriseMe}
             className="w-full md:w-auto px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg font-bold shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2 transition-all"
           >
             <Dices size={18} />
             <span className="inline">Surprise Me</span>
           </button>
        </div>
      </div>

      {/* Detail Modal (Pop-up) */}
      {focusedProgression && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-purple-500/50 rounded-2xl p-8 relative shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setFocusedProgression(null)}
              className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="flex flex-col items-center text-center">
               <div className="mb-2 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 text-xs font-bold uppercase tracking-widest rounded-full flex items-center gap-2 border border-purple-200 dark:border-purple-800">
                 <Zap size={12} fill="currentColor" /> {focusedProgression.genre}
               </div>
               <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{focusedProgression.name}</h2>
               <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mb-8 leading-relaxed">{focusedProgression.description}</p>
               
               {/* Full Progression View */}
               <div className="flex flex-wrap gap-4 justify-center mb-6">
                  {focusedProgression.roman.map((r, i) => (
                     <div key={i} className="flex flex-col items-center gap-2">
                        <div className="w-24 h-24 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
                          <span className="text-2xl font-bold text-slate-800 dark:text-white">{getChordFromRoman(r, selectedKey)}</span>
                        </div>
                        <span className="font-mono text-slate-500 text-sm font-bold">{r}</span>
                     </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProgressions.map((prog, idx) => (
          <div 
            key={idx} 
            onClick={() => setFocusedProgression(prog)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-900/5 transition-all group shadow-sm flex flex-col h-full cursor-pointer relative"
          >
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-purple-500">
               <Maximize2 size={16} />
            </div>

            <div className="p-6 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{prog.name}</h3>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs text-slate-500 border border-slate-200 dark:border-slate-800 px-1.5 rounded bg-slate-50 dark:bg-transparent">{prog.genre}</span>
                    <span className="text-xs text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900/30 bg-purple-50 dark:bg-purple-900/10 px-1.5 rounded">{prog.mood}</span>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 flex-1 line-clamp-2">
                {prog.description}
              </p>

              <div className="space-y-4">
                {/* Preview Chords (First 6) */}
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-wrap gap-3 items-center min-h-[60px]">
                  {prog.roman.slice(0, 6).map((r, i) => (
                    <React.Fragment key={i}>
                      <span className="text-lg font-bold text-slate-800 dark:text-white">
                        {getChordFromRoman(r, selectedKey)}
                      </span>
                      {i < prog.roman.length - 1 && i < 5 && <span className="text-slate-300 dark:text-slate-700">|</span>}
                    </React.Fragment>
                  ))}
                  {prog.roman.length > 6 && <span className="text-slate-400 text-xs italic">+{prog.roman.length - 6} more</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {filteredProgressions.length === 0 && (
          <div className="col-span-full text-center py-20 text-slate-500">
            No progressions match these filters.
          </div>
        )}
      </div>
    </div>
  );
};

export default ChordProgressions;
