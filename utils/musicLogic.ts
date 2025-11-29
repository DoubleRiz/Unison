// Chromatic scale using Sharps for simplification
export const CHROMATIC_SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Map flat notes to sharps to normalize input
const NOTE_MAPPINGS: Record<string, string> = {
  'Cb': 'B', 'Db': 'C#', 'Eb': 'D#', 'Fb': 'E', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#', 'E#': 'F', 'B#': 'C'
};

// Regex to parse a chord: Root (A-G plus #/b) + Quality (m, maj7, etc) + Bass (/F#)
const CHORD_REGEX = /^([A-G][#b]?)(.*?)(\/[A-G][#b]?)?$/;

const normalizeNote = (note: string): string => {
  return NOTE_MAPPINGS[note] || note;
};

const getNoteIndex = (note: string): number => {
  const normalized = normalizeNote(note);
  return CHROMATIC_SCALE.indexOf(normalized);
};

const transposeNote = (note: string, semitones: number): string => {
  const index = getNoteIndex(note);
  if (index === -1) return note; // Return original if invalid

  // Handle negative modulo correctly in JS
  let newIndex = (index + semitones) % 12;
  if (newIndex < 0) newIndex += 12;

  return CHROMATIC_SCALE[newIndex];
};

/**
 * Transposes a full chord string (e.g., "Am7", "C/G")
 */
export const transpose = (chord: string, semitones: number): string => {
  if (!chord) return '';
  if (semitones === 0) return chord;

  const match = chord.match(CHORD_REGEX);
  if (!match) return chord; // If it doesn't look like a chord, return as is

  const root = match[1];
  const quality = match[2] || '';
  const bass = match[3] ? match[3].substring(1) : null; // remove slash

  const newRoot = transposeNote(root, semitones);
  let newBass = '';

  if (bass) {
    newBass = '/' + transposeNote(bass, semitones);
  }

  return `${newRoot}${quality}${newBass}`;
};

/**
 * Transposes the entire content of a song by finding chords in brackets.
 * Preserves section headers like [Chorus].
 */
export const transposeContent = (content: string, semitones: number): string => {
  if (semitones === 0) return content;
  
  return content.replace(/\[(.*?)\]/g, (match, inner) => {
    // Check if it is a section header to avoid transposing "Chorus" to "Dhorus"
    // We check against common section names or if the inner text doesn't look like a chord
    if (/^(Intro|Verse|Chorus|Refrain|Bridge|Pont|Pre-Chorus|Outro|Solo|Instrumental|Couplet)/i.test(inner)) {
       return match;
    }

    // Double check if it looks like a chord before transposing
    if (!CHORD_REGEX.test(inner)) {
        return match;
    }

    const transposed = transpose(inner, semitones);
    return `[${transposed}]`;
  });
};

/**
 * Converts a chord to its scale degree relative to a Key.
 * e.g., Key: C, Chord: Am -> 6m
 * Key: C, Chord: G -> 5
 */
export const convertToDegree = (chord: string, key: string): string => {
  if (!chord || !key) return '';

  const chordMatch = chord.match(CHORD_REGEX);
  if (!chordMatch) return chord;

  const root = chordMatch[1];
  const quality = chordMatch[2] || '';
  // We ignore bass for degree notation usually, or treat it separately, 
  // but for this simplified version, we'll append the bass as a degree too if present.
  const bass = chordMatch[3] ? chordMatch[3].substring(1) : null;

  const keyIndex = getNoteIndex(key);
  const rootIndex = getNoteIndex(root);

  if (keyIndex === -1 || rootIndex === -1) return chord;

  let interval = (rootIndex - keyIndex) % 12;
  if (interval < 0) interval += 12;

  // Map chromatic interval to scale degree (Arabic numerals for Nashville-ish style)
  const degrees: Record<number, string> = {
    0: '1',
    1: 'b2',
    2: '2',
    3: 'b3',
    4: '3',
    5: '4',
    6: 'b5',
    7: '5',
    8: 'b6',
    9: '6',
    10: 'b7',
    11: '7'
  };

  const degreeRoot = degrees[interval] || '?';
  
  let degreeBass = '';
  if (bass) {
    const bassIndex = getNoteIndex(bass);
    if (bassIndex !== -1) {
      let bassInterval = (bassIndex - keyIndex) % 12;
      if (bassInterval < 0) bassInterval += 12;
      degreeBass = '/' + (degrees[bassInterval] || '?');
    }
  }

  return `${degreeRoot}${quality}${degreeBass}`;
};

/**
 * Detects if a line is a section header (e.g. "[Chorus]", "[Verse 1]")
 */
export const getSectionType = (line: string): string | null => {
  const trimmed = line.trim();
  // Matches brackets containing common section names
  const sectionRegex = /^\[(Intro|Verse|Chorus|Refrain|Bridge|Pont|Pre-Chorus|Outro|Solo|Instrumental|Couplet).*\]$/i;
  const match = trimmed.match(sectionRegex);
  
  if (match) {
    // Return the text inside brackets without brackets
    return trimmed.replace('[', '').replace(']', '');
  }
  return null;
};