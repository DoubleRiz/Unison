import { describe, it, expect } from 'vitest';
import { buildInitialDocument } from './setlistDocument';
import { SetlistItem, Song } from '../types';

const makeSong = (id: string): Song => ({
  id,
  title: `Song ${id}`,
  artist: 'Artist',
  bpm: 120,
  key: 'C',
  content: '[Verse]\n[C]Hello',
  is_public: false,
});

describe('buildInitialDocument', () => {
  it('wraps song items in songBlock nodes with empty paragraphs around them', () => {
    const items: SetlistItem[] = [
      { type: 'song', id: 'ss1', song: makeSong('s1'), transpose: 0 },
      { type: 'song', id: 'ss2', song: makeSong('s2'), transpose: 2 },
    ];
    const doc = buildInitialDocument(items);

    expect(doc.type).toBe('doc');
    expect(doc.content[0]).toEqual({ type: 'paragraph' });
    expect(doc.content[1]).toEqual({
      type: 'songBlock',
      attrs: { setlistSongId: 'ss1', songId: 's1', transpose: 0 },
    });
    expect(doc.content[2]).toEqual({ type: 'paragraph' });
    expect(doc.content[3]).toEqual({
      type: 'songBlock',
      attrs: { setlistSongId: 'ss2', songId: 's2', transpose: 2 },
    });
    expect(doc.content[4]).toEqual({ type: 'paragraph' });
  });

  it('converts a "lg" text note into an H1 heading with its color as a textStyle mark', () => {
    const items: SetlistItem[] = [
      { type: 'text', id: 'txt1', content: 'Set 1', color: 'amber', size: 'lg' },
    ];
    const doc = buildInitialDocument(items);

    expect(doc.content[1]).toEqual({
      type: 'heading',
      attrs: { level: 1 },
      content: [
        { type: 'text', text: 'Set 1', marks: [{ type: 'textStyle', attrs: { color: '#f59e0b' } }] },
      ],
    });
  });

  it('converts a "sm" text note with default color into a plain paragraph (no marks)', () => {
    const items: SetlistItem[] = [
      { type: 'text', id: 'txt1', content: 'Note', color: 'default', size: 'sm' },
    ];
    const doc = buildInitialDocument(items);

    expect(doc.content[1]).toEqual({
      type: 'paragraph',
      content: [{ type: 'text', text: 'Note' }],
    });
  });
});
