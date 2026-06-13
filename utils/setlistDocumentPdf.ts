import { jsPDF } from 'jspdf';
import { SetlistItem, Song, TiptapDoc } from '../types';
import { PdfContext, renderSongToPdf, renderTextNodeToPdf } from './pdfRender';

const buildSongLookup = (items: SetlistItem[]): Map<string, { song: Song; transpose: number }> => {
  const map = new Map<string, { song: Song; transpose: number }>();
  for (const item of items) {
    if (item.type === 'song') map.set(item.id, { song: item.song, transpose: item.transpose });
  }
  return map;
};

export const exportLayoutDocumentToPdf = (
  layoutDoc: TiptapDoc,
  setlistItems: SetlistItem[],
  pdfTitle: string
): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  const ctx: PdfContext = { doc, margin, contentWidth, pageHeight, cursorY: 20 };

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150);
  doc.text(pdfTitle, margin, 10);
  doc.text('Setlist Export', pageWidth - margin, 10, { align: 'right' });

  const songLookup = buildSongLookup(setlistItems);

  for (const node of layoutDoc.content) {
    if (node.type === 'songBlock') {
      const entry = songLookup.get(node.attrs?.setlistSongId as string);
      if (!entry) continue;
      renderSongToPdf(ctx, entry.song, entry.transpose);
      ctx.cursorY += 15;
      continue;
    }
    renderTextNodeToPdf(ctx, node);
  }

  return ctx.doc;
};
