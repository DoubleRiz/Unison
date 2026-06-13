import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { SongBlockView } from './SongBlockView';

export const SongBlock = Node.create({
  name: 'songBlock',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      setlistSongId: { default: null },
      songId: { default: null },
      transpose: { default: 0 },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-song-block]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-song-block': '' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(SongBlockView);
  },
});
