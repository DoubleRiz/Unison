import { jsPDF } from 'jspdf';
import { SetlistItem } from '../types';
import { PdfContext, renderSongToPdf, renderTextNoteToPdf } from './pdfRender';

export const exportSetlistListToPdf = (setlistItems: SetlistItem[], pdfTitle: string): jsPDF => {
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

  for (const item of setlistItems) {
    if (item.type === 'song') {
      renderSongToPdf(ctx, item.song, item.transpose);
      ctx.cursorY += 15;
    } else {
      renderTextNoteToPdf(ctx, { id: item.id, content: item.content, color: item.color, size: item.size, position: 0 });
    }
  }

  return ctx.doc;
};
