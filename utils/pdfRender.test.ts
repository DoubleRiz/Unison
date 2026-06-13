import { describe, it, expect } from 'vitest';
import { sanitizePdfText } from './pdfRender';

describe('sanitizePdfText', () => {
  it('replaces curly quotes with straight quotes', () => {
    expect(sanitizePdfText('don’t')).toBe("don't");
    expect(sanitizePdfText('“hello”')).toBe('"hello"');
  });

  it('collapses special whitespace and expands tabs', () => {
    expect(sanitizePdfText('a b\tc')).toBe('a b    c');
  });

  it('strips accents via NFD normalization', () => {
    expect(sanitizePdfText('café écran')).toBe('cafe ecran');
  });

  it('replaces œ/Œ ligatures and ellipsis', () => {
    expect(sanitizePdfText('œuvre… Œuf')).toBe('oeuvre... Oeuf');
  });
});
