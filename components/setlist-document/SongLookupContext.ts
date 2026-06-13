import { createContext } from 'react';
import { Song } from '../../types';

export const SongLookupContext = createContext<Map<string, Song>>(new Map());
