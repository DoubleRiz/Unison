import { describe, it, expect } from 'vitest';
import { flattenParagraphRuns, tokenizeRuns, wrapTokensToLines, hexToRgb, TextToken } from './setlistDocumentText';
import { TiptapNode } from '../types';

describe('flattenParagraphRuns', () => {
  it('extracts text runs with bold/italic flags and color from marks', () => {
    const node: TiptapNode = {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Hello ' },
        { type: 'text', text: 'world', marks: [{ type: 'bold' }, { type: 'textStyle', attrs: { color: '#f59e0b' } }] },
      ],
    };
    expect(flattenParagraphRuns(node)).toEqual([
      { text: 'Hello ', bold: false, italic: false, color: null },
      { text: 'world', bold: true, italic: false, color: [245, 158, 11] },
    ]);
  });

  it('returns an empty array for a paragraph with no content', () => {
    expect(flattenParagraphRuns({ type: 'paragraph' })).toEqual([]);
  });
});

describe('tokenizeRuns', () => {
  it('splits runs into word and whitespace tokens preserving style', () => {
    const tokens = tokenizeRuns([{ text: 'Hello world', bold: false, italic: false, color: null }]);
    expect(tokens.map((t) => t.text)).toEqual(['Hello', ' ', 'world']);
  });
});

describe('wrapTokensToLines', () => {
  const measure = (text: string) => text.length;

  it('wraps tokens onto multiple lines once maxWidth is exceeded', () => {
    const tokens: TextToken[] = tokenizeRuns([{ text: 'one two three', bold: false, italic: false, color: null }]);
    const lines = wrapTokensToLines(tokens, 7, measure);
    expect(lines.map((line) => line.map((t) => t.text).join(''))).toEqual(['one two', 'three']);
  });

  it('returns an empty array for no tokens', () => {
    expect(wrapTokensToLines([], 100, measure)).toEqual([]);
  });
});

describe('hexToRgb', () => {
  it('converts a hex color to an RGB tuple', () => {
    expect(hexToRgb('#f59e0b')).toEqual([245, 158, 11]);
  });

  it('returns null for an invalid hex string', () => {
    expect(hexToRgb('not-a-color')).toBeNull();
  });
});
