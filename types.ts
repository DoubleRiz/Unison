export interface Song {
  id: string;
  user_id?: string; // Optionnel pour l'instant (mock), obligatoire avec la BDD
  title: string;
  artist: string;
  bpm: number | null; // Devenu optionnel (nullable)
  key: string; // Correspondra à original_key en BDD
  content: string; 
  youtubeUrl?: string;
  is_public: boolean; // Nouveau champ pour la visibilité
}

export enum NotationMode {
  LETTERS = 'LETTERS',
  DEGREES = 'DEGREES'
}

export interface Segment {
  chord: string | null;
  lyrics: string;
}

export interface Line {
  segments: Segment[];
}