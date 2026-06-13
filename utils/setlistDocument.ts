import { SetlistItem, SongItem, TextItem, TiptapDoc, TiptapNode } from '../types';
import { TEXT_COLORS } from '../constants/textNoteStyles';

const TEXT_SIZE_TO_HEADING_LEVEL: Record<TextItem['size'], number | null> = {
  sm: null,
  md: 3,
  lg: 1,
};

const emptyParagraph = (): TiptapNode => ({ type: 'paragraph' });

const songBlockNode = (item: SongItem): TiptapNode => ({
  type: 'songBlock',
  attrs: { setlistSongId: item.id, songId: item.song.id, transpose: item.transpose },
});

const textNoteToNode = (item: TextItem): TiptapNode => {
  const textNode: TiptapNode = { type: 'text', text: item.content };

  const colorHex = TEXT_COLORS[item.color]?.hex;
  if (item.color !== 'default' && colorHex) {
    textNode.marks = [{ type: 'textStyle', attrs: { color: colorHex } }];
  }

  const headingLevel = TEXT_SIZE_TO_HEADING_LEVEL[item.size];
  if (headingLevel) {
    return { type: 'heading', attrs: { level: headingLevel }, content: [textNode] };
  }
  return { type: 'paragraph', content: [textNode] };
};

export const buildInitialDocument = (items: SetlistItem[]): TiptapDoc => {
  const content: TiptapNode[] = [emptyParagraph()];

  for (const item of items) {
    if (item.type === 'song') {
      content.push(songBlockNode(item));
      content.push(emptyParagraph());
    } else {
      content.push(textNoteToNode(item));
    }
  }

  return { type: 'doc', content };
};

export const getSongBlockIds = (doc: TiptapDoc): string[] =>
  doc.content
    .filter((node) => node.type === 'songBlock')
    .map((node) => node.attrs!.setlistSongId as string);

export const removeOrphanSongBlocks = (doc: TiptapDoc, validSetlistSongIds: Set<string>): TiptapDoc => ({
  ...doc,
  content: doc.content.filter(
    (node) => node.type !== 'songBlock' || validSetlistSongIds.has(node.attrs!.setlistSongId as string)
  ),
});
