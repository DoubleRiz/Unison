import { describe, it, expect } from 'vitest';
import { exportSetlistListToPdf } from './setlistListPdf';
import { SetlistItem, Song } from '../types';

const makeSong = (id: string): Song => ({
  id,
  title: `Song ${id}`,
  artist: 'Artist',
  bpm: 120,
  key: 'C',
  content: '[Verse]\n[C]Hello world',
  is_public: false,
});

describe('exportSetlistListToPdf', () => {
  it('renders songs and text notes in order without throwing', () => {
    const items: SetlistItem[] = [
      { type: 'text', id: 't1', content: 'Set 1', color: 'amber', size: 'lg' },
      { type: 'song', id: 'ss1', song: makeSong('s1'), transpose: 0 },
      { type: 'text', id: 't2', content: 'Break', color: 'default', size: 'sm' },
      { type: 'song', id: 'ss2', song: makeSong('s2'), transpose: 2 },
    ];

    const pdf = exportSetlistListToPdf(items, 'My Gig');
    expect(pdf.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });

  it('handles an empty setlist without throwing', () => {
    expect(() => exportSetlistListToPdf([], 'Empty')).not.toThrow();
  });
});
