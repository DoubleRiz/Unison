import React, { useContext } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { GripVertical, Lock, Minus, Plus, X } from 'lucide-react';
import { SongLookupContext } from './SongLookupContext';
import { SongBlockActionsContext } from './SongBlockActionsContext';
import { SongBlockAttrs } from '../../types';

export const SongBlockView: React.FC<NodeViewProps> = ({ node, updateAttributes }) => {
  const songLookup = useContext(SongLookupContext);
  const actions = useContext(SongBlockActionsContext);
  const { setlistSongId, songId, transpose } = node.attrs as SongBlockAttrs;
  const song = songLookup.get(songId);

  const changeTranspose = (delta: number) => {
    const newTranspose = transpose + delta;
    updateAttributes({ transpose: newTranspose });
    actions.onTransposeChange(setlistSongId, newTranspose);
  };

  if (!song) {
    return (
      <NodeViewWrapper
        className="my-2 p-3 rounded-lg border border-dashed border-red-400 dark:border-red-500 text-red-500 dark:text-red-400 text-sm"
        contentEditable={false}
      >
        Chanson introuvable
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper
      className="my-2 flex items-center gap-3 p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
      contentEditable={false}
    >
      <span data-drag-handle className="cursor-grab text-slate-400 dark:text-slate-500 shrink-0">
        <GripVertical size={16} />
      </span>
      <Lock size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="font-bold truncate">{song.title}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{song.artist} • {song.key}</div>
      </div>
      <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded shrink-0">
        <button type="button" onClick={() => changeTranspose(-1)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700">
          <Minus size={12} />
        </button>
        <div className="w-8 text-center text-xs font-mono font-bold">
          {transpose > 0 ? '+' : ''}{transpose}
        </div>
        <button type="button" onClick={() => changeTranspose(1)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700">
          <Plus size={12} />
        </button>
      </div>
      <button type="button" onClick={() => actions.onRemove(setlistSongId)} className="p-1 text-slate-400 dark:text-slate-500 hover:text-red-500 shrink-0">
        <X size={16} />
      </button>
    </NodeViewWrapper>
  );
};
