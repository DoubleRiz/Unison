import { describe, it, expect } from 'vitest';
import { exportLayoutDocumentToPdf } from './setlistDocumentPdf';
import { SetlistItem, Song, TiptapDoc } from '../types';

const makeSong = (id: string): Song => ({
  id,
  title: `Song ${id}`,
  artist: 'Artist',
  bpm: 120,
  key: 'C',
  content: '[Verse]\n[C]Hello world',
  is_public: false,
});

describe('exportLayoutDocumentToPdf', () => {
  it('renders a document with a heading and a song block without throwing', () => {
    const items: SetlistItem[] = [
      { type: 'song', id: 'ss1', song: makeSong('s1'), transpose: 1 },
    ];
    const doc: TiptapDoc = {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Gig title' }] },
        { type: 'songBlock', attrs: { setlistSongId: 'ss1', songId: 's1', transpose: 1 } },
      ],
    };

    const pdf = exportLayoutDocumentToPdf(doc, items, 'My Setlist');
    expect(pdf.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });

  it('skips songBlock nodes whose setlistSongId has no matching setlist item', () => {
    const doc: TiptapDoc = {
      type: 'doc',
      content: [{ type: 'songBlock', attrs: { setlistSongId: 'missing', songId: 's1', transpose: 0 } }],
    };

    expect(() => exportLayoutDocumentToPdf(doc, [], 'My Setlist')).not.toThrow();
  });
});
