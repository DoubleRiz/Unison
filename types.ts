
export interface Song {
  id: string;
  user_id?: string;
  title: string;
  artist: string;
  bpm: number | null;
  key: string; 
  content: string; 
  notes?: string; // Performance notes, verses, effect settings
  youtubeUrl?: string;
  audioUrl?: string;
  is_public: boolean;
  is_favorite?: boolean;
  shared_with_group_id?: string | null;
  genres?: string[];
  tags?: string[];
  forked_from?: string | null;
}

export interface Comment {
  id: string;
  song_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: {
    username: string;
    avatar_url: string;
  };
}

export interface Setlist {
  id: string;
  user_id: string;
  group_id?: string | null;
  title: string;
  created_at: string;
  songs?: Song[]; // Optional, used for UI display only
}

export interface SetlistSong {
  id: string;
  setlist_id: string;
  song_id: string;
  position: number;
}

export interface Group {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  status: 'pending' | 'accepted';
  role: 'member' | 'admin';
  group?: Group; // Joined data
  user?: { username: string; avatar_url: string }; // Joined data
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

export const GENRES = ['Rock', 'Blues', 'Country', 'Pop', 'Worship', 'Metal', 'Rap', 'Rn\'B', 'Soul', 'Jazz','Gospel'];
