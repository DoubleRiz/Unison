import React from 'react';
import { Editor } from '@tiptap/react';
import {
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Heading1, Heading2, Heading3, Music,
} from 'lucide-react';
import { TEXT_COLORS } from '../../constants/textNoteStyles';
// Side-effect imports: these extensions augment TipTap's `Commands`/`ChainedCommands`
// interfaces (toggleBold, toggleHeading, setTextAlign, setColor, etc.). They are
// re-imported here so this file type-checks in isolation; the actual editor
// instance and its extensions are configured in SetlistDocumentEditor.
// `@tiptap/starter-kit` bundles Bold, Italic, Heading, BulletList and OrderedList.
import '@tiptap/starter-kit';
import '@tiptap/extension-underline';
import '@tiptap/extension-text-align';
import '@tiptap/extension-color';

interface DocumentToolbarProps {
  editor: Editor;
  onInsertSong: () => void;
}

const ToolbarButton: React.FC<{ active: boolean; onClick: () => void; label: string; children: React.ReactNode }> = ({
  active, onClick, label, children,
}) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    aria-label={label}
    className={`p-2 rounded ${active ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
  >
    {children}
  </button>
);

const Divider: React.FC = () => <div className="w-px h-6 bg-slate-700 mx-1" />;

export const DocumentToolbar: React.FC<DocumentToolbarProps> = ({ editor, onInsertSong }) => {
  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-2 mb-4 overflow-x-auto">
      <ToolbarButton label="Gras" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold size={16} />
      </ToolbarButton>
      <ToolbarButton label="Italique" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic size={16} />
      </ToolbarButton>
      <ToolbarButton label="Souligné" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <UnderlineIcon size={16} />
      </ToolbarButton>

      <Divider />

      <ToolbarButton label="Titre 1" active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
        <Heading1 size={16} />
      </ToolbarButton>
      <ToolbarButton label="Titre 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        <Heading2 size={16} />
      </ToolbarButton>
      <ToolbarButton label="Titre 3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        <Heading3 size={16} />
      </ToolbarButton>

      <Divider />

      <ToolbarButton label="Liste à puces" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List size={16} />
      </ToolbarButton>
      <ToolbarButton label="Liste numérotée" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered size={16} />
      </ToolbarButton>

      <Divider />

      <ToolbarButton label="Aligner à gauche" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
        <AlignLeft size={16} />
      </ToolbarButton>
      <ToolbarButton label="Centrer" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
        <AlignCenter size={16} />
      </ToolbarButton>
      <ToolbarButton label="Aligner à droite" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
        <AlignRight size={16} />
      </ToolbarButton>

      <Divider />

      {Object.entries(TEXT_COLORS).map(([key, color]) => (
        <button
          key={key}
          type="button"
          title={color.label}
          aria-label={color.label}
          onClick={() => (key === 'default'
            ? editor.chain().focus().unsetColor().run()
            : editor.chain().focus().setColor(color.hex).run())}
          className="w-6 h-6 rounded-full border border-slate-600"
          style={{ backgroundColor: color.hex }}
        />
      ))}

      <Divider />

      <button
        type="button"
        onClick={onInsertSong}
        className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 text-cyan-400 text-xs hover:bg-slate-700"
      >
        <Music size={14} /> Insérer une chanson
      </button>
    </div>
  );
};
