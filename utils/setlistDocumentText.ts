import { TiptapNode } from '../types';

export interface TextRun {
  text: string;
  bold: boolean;
  italic: boolean;
  color: [number, number, number] | null;
}

export type TextToken = TextRun;

export const hexToRgb = (hex: string): [number, number, number] | null => {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!match) return null;
  return [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16)];
};

export const flattenParagraphRuns = (node: TiptapNode): TextRun[] => {
  return (node.content || [])
    .filter((child) => child.type === 'text' && typeof child.text === 'string')
    .map((child) => {
      const marks = child.marks || [];
      const bold = marks.some((m) => m.type === 'bold');
      const italic = marks.some((m) => m.type === 'italic');
      const colorMark = marks.find((m) => m.type === 'textStyle' && m.attrs?.color);
      const color = colorMark ? hexToRgb(colorMark.attrs!.color as string) : null;
      return { text: child.text as string, bold, italic, color };
    });
};

export const tokenizeRuns = (runs: TextRun[]): TextToken[] => {
  const tokens: TextToken[] = [];
  for (const run of runs) {
    const parts = run.text.split(/(\s+)/).filter((part) => part.length > 0);
    for (const part of parts) {
      tokens.push({ text: part, bold: run.bold, italic: run.italic, color: run.color });
    }
  }
  return tokens;
};

export const wrapTokensToLines = (
  tokens: TextToken[],
  maxWidth: number,
  measure: (text: string, token: TextToken) => number
): TextToken[][] => {
  if (tokens.length === 0) return [];

  const lines: TextToken[][] = [];
  let currentLine: TextToken[] = [];
  let currentWidth = 0;

  for (const token of tokens) {
    const isWhitespace = /^\s+$/.test(token.text);
    if (isWhitespace && currentLine.length === 0) continue;

    const width = measure(token.text, token);
    if (currentLine.length > 0 && currentWidth + width > maxWidth) {
      lines.push(currentLine);
      currentLine = [];
      currentWidth = 0;
      if (isWhitespace) continue;
    }

    currentLine.push(token);
    currentWidth += width;
  }

  if (currentLine.length > 0) lines.push(currentLine);
  return lines;
};
