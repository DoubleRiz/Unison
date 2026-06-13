import { jsPDF } from 'jspdf';
import { Song, TiptapNode } from '../types';
import { transposeContent, transpose, getSectionType } from './musicLogic';
import { flattenParagraphRuns, tokenizeRuns, wrapTokensToLines, TextToken } from './setlistDocumentText';

export interface PdfContext {
  doc: jsPDF;
  margin: number;
  contentWidth: number;
  pageHeight: number;
  cursorY: number;
}

export const SONG_LINE_HEIGHT = 5.2;

export const startNewPage = (ctx: PdfContext): void => {
  ctx.doc.addPage();
  ctx.cursorY = 20;
};

export const sanitizePdfText = (text: string): string => {
  return text
    .replace(/[  -​  　]/g, ' ')
    .replace(/\t/g, '    ')
    .replace(/[‘’`]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, '...')
    .replace(/œ/g, 'oe').replace(/Œ/g, 'Oe')
    .normalize('NFD').replace(/[̀-ͯ]/g, '');
};

export const renderSongToPdf = (ctx: PdfContext, song: Song, transposeSemitones: number): void => {
  const { doc, margin, contentWidth, pageHeight } = ctx;

  if (ctx.cursorY + 30 > pageHeight - margin) startNewPage(ctx);

  doc.setFontSize(24);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  doc.text(song.title, margin, ctx.cursorY);
  ctx.cursorY += 7;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const keyText = transposeSemitones !== 0
    ? `${song.key} (${transposeSemitones > 0 ? '+' : ''}${transposeSemitones}) -> ${transpose(song.key, transposeSemitones)}`
    : song.key;
  doc.text(`${song.artist} • ${keyText}`, margin, ctx.cursorY);
  ctx.cursorY += 13;

  doc.setFont('courier', 'normal');
  doc.setFontSize(11);

  const transposedContent = transposeContent(song.content, transposeSemitones);
  const lines = transposedContent.split(/\r?\n/);

  lines.forEach((line) => {
    if (ctx.cursorY > pageHeight - margin) startNewPage(ctx);

    const sectionName = getSectionType(line);
    if (sectionName) {
      ctx.cursorY += 3;
      doc.setFont('courier', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(sanitizePdfText(line.trim().toUpperCase()), margin, ctx.cursorY);
      doc.setFont('courier', 'normal');
      doc.setTextColor(0, 0, 0);
      ctx.cursorY += SONG_LINE_HEIGHT;
      return;
    }

    const parts = line.split(/\[(.*?)\]/g);
    let currentX = margin;
    doc.setFontSize(11);

    parts.forEach((part, i) => {
      const isChord = i % 2 === 1;
      if (isChord) {
        doc.setFont('courier', 'bold');
        doc.setTextColor(0, 153, 184);
      } else {
        doc.setFont('courier', 'normal');
        doc.setTextColor(0, 0, 0);
      }

      const textToRender = sanitizePdfText(part);
      if (textToRender) {
        doc.text(textToRender, currentX, ctx.cursorY);
        currentX += doc.getTextWidth(textToRender);
      }
    });

    ctx.cursorY += SONG_LINE_HEIGHT;
  });

  if (song.notes?.trim()) {
    ctx.cursorY += 5;
    if (ctx.cursorY > pageHeight - margin - 15) startNewPage(ctx);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(130, 130, 130);
    doc.text('NOTES', margin, ctx.cursorY);
    ctx.cursorY += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.splitTextToSize(song.notes, contentWidth).forEach((nl: string) => {
      if (ctx.cursorY > pageHeight - margin) startNewPage(ctx);
      doc.text(nl, margin, ctx.cursorY);
      ctx.cursorY += 4.5;
    });
  }
};

const FONT_SIZE_NORMAL = 11;
const HEADING_FONT_SIZES: Record<number, number> = { 1: 18, 2: 14, 3: 12 };
const LINE_HEIGHT_RATIO = 0.5;

const lineHeightFor = (fontSize: number): number => fontSize * LINE_HEIGHT_RATIO;

const fontStyleFor = (token: TextToken): string => {
  if (token.bold && token.italic) return 'bolditalic';
  if (token.bold) return 'bold';
  if (token.italic) return 'italic';
  return 'normal';
};

export const renderParagraphToPdf = (
  ctx: PdfContext,
  node: TiptapNode,
  fontSize: number,
  prefix: string,
  textAlign: string
): void => {
  const runs = flattenParagraphRuns(node);
  const lineHeight = lineHeightFor(fontSize);

  if (runs.length === 0 || runs.every((r) => r.text.trim() === '')) {
    ctx.cursorY += lineHeight;
    return;
  }

  ctx.doc.setFontSize(fontSize);
  const measure = (text: string, token: TextToken): number => {
    ctx.doc.setFont('helvetica', fontStyleFor(token));
    return ctx.doc.getTextWidth(text);
  };

  const prefixWidth = prefix ? ctx.doc.getTextWidth(prefix) : 0;
  const tokens = tokenizeRuns(runs);
  const lines = wrapTokensToLines(tokens, ctx.contentWidth - prefixWidth, measure);

  lines.forEach((line, lineIndex) => {
    if (ctx.cursorY > ctx.pageHeight - ctx.margin) startNewPage(ctx);

    const lineWidth = line.reduce((sum, token) => sum + measure(token.text, token), 0)
      + (lineIndex === 0 ? prefixWidth : 0);

    let x = ctx.margin;
    if (textAlign === 'center') x = ctx.margin + (ctx.contentWidth - lineWidth) / 2;
    if (textAlign === 'right') x = ctx.margin + ctx.contentWidth - lineWidth;

    if (lineIndex === 0 && prefix) {
      ctx.doc.setFont('helvetica', 'normal');
      ctx.doc.setTextColor(0, 0, 0);
      ctx.doc.text(prefix, x, ctx.cursorY);
      x += prefixWidth;
    }

    line.forEach((token) => {
      const width = measure(token.text, token);
      if (token.text.trim() !== '') {
        if (token.color) ctx.doc.setTextColor(token.color[0], token.color[1], token.color[2]);
        else ctx.doc.setTextColor(0, 0, 0);
        ctx.doc.text(sanitizePdfText(token.text), x, ctx.cursorY);
      }
      x += width;
    });

    ctx.cursorY += lineHeight;
  });
};

export const renderTextNodeToPdf = (ctx: PdfContext, node: TiptapNode): void => {
  const textAlign = (node.attrs?.textAlign as string) || 'left';

  switch (node.type) {
    case 'heading': {
      const level = (node.attrs?.level as number) || 1;
      renderParagraphToPdf(ctx, node, HEADING_FONT_SIZES[level] || FONT_SIZE_NORMAL, '', textAlign);
      return;
    }
    case 'paragraph':
      renderParagraphToPdf(ctx, node, FONT_SIZE_NORMAL, '', textAlign);
      return;
    case 'bulletList':
      (node.content || []).forEach((item) =>
        (item.content || []).forEach((child) =>
          renderParagraphToPdf(ctx, child, FONT_SIZE_NORMAL, '• ', (child.attrs?.textAlign as string) || 'left')
        )
      );
      return;
    case 'orderedList':
      (node.content || []).forEach((item, index) =>
        (item.content || []).forEach((child) =>
          renderParagraphToPdf(ctx, child, FONT_SIZE_NORMAL, `${index + 1}. `, (child.attrs?.textAlign as string) || 'left')
        )
      );
      return;
    default:
      return;
  }
};
