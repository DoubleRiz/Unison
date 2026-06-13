import { jsPDF } from 'jspdf';
import { Song } from '../types';
import { transposeContent, transpose, getSectionType } from './musicLogic';

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
