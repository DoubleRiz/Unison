import { createContext } from 'react';

export interface SongBlockActions {
  onRemove: (setlistSongId: string) => void;
  onTransposeChange: (setlistSongId: string, newTranspose: number) => void;
}

export const SongBlockActionsContext = createContext<SongBlockActions>({
  onRemove: () => {},
  onTransposeChange: () => {},
});
