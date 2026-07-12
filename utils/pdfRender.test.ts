import { describe, it, expect } from 'vitest';
import { jsPDF } from 'jspdf';
import { sanitizePdfText, renderTextNoteToPdf, PdfContext } from './pdfRender';
import { SetlistTextNote } from '../types';

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

describe('renderTextNoteToPdf', () => {
  const makeCtx = (): PdfContext => {
    const doc = new jsPDF();
    return { doc, margin: 15, contentWidth: 180, pageHeight: 297, cursorY: 20 };
  };

  it('advances cursorY after rendering a note', () => {
    const ctx = makeCtx();
    const startY = ctx.cursorY;
    const note: SetlistTextNote = { id: 'n1', content: 'Set break', color: 'amber', size: 'lg', position: 0 };

    renderTextNoteToPdf(ctx, note);

    expect(ctx.cursorY).toBeGreaterThan(startY);
  });

  it('starts a new page when the note would overflow the current page', () => {
    const ctx = makeCtx();
    ctx.cursorY = ctx.pageHeight - ctx.margin - 1;
    const note: SetlistTextNote = { id: 'n1', content: 'Overflow note', color: 'default', size: 'md', position: 0 };
    const pagesBefore = ctx.doc.getNumberOfPages();

    renderTextNoteToPdf(ctx, note);

    expect(ctx.doc.getNumberOfPages()).toBeGreaterThan(pagesBefore);
  });

  it('does not throw for an unknown color or size key', () => {
    const ctx = makeCtx();
    const note = { id: 'n1', content: 'Weird', color: 'nonexistent', size: 'xl' } as unknown as SetlistTextNote;
    expect(() => renderTextNoteToPdf(ctx, note)).not.toThrow();
  });
});
