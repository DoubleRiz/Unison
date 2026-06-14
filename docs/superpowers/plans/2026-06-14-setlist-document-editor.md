# Setlist Document Editor (PDF Layout) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Document" view to the setlist editor — a Word-like rich text editor (TipTap) where users freely write and format text, while songs appear as locked, synced blocks — and generate the PDF export from this document.

**Architecture:** A new `layout_document` jsonb column stores a TipTap JSON document per setlist. Pure utility modules build/clean this document and render it to a jsPDF document (reusing the existing chord-rendering logic for song blocks). A new `SetlistDocumentEditor` component wraps TipTap with a custom atomic `songBlock` node, syncing reorder/remove/transpose back to `setlist_songs`. The existing "Liste" view and `text_notes`/Perform mode are untouched.

**Tech Stack:** React 19, TypeScript, TipTap v3 (`@tiptap/react`, `@tiptap/starter-kit`, extensions for text-align/color/underline), jsPDF, Supabase, Vitest (new, for pure-logic unit tests).

---

## Phase 0 — Setup

### Task 1: Add Vitest test runner

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `utils/sanity.test.ts` (temporary, removed in Task 5)

- [ ] **Step 1: Add devDependency and test script**

In `package.json`, add to `"devDependencies"`:
```json
"vitest": "^4.1.8"
```
And add to `"scripts"`:
```json
"test": "vitest run"
```

- [ ] **Step 2: Install**

Run: `npm install`
Expected: installs without errors.

- [ ] **Step 3: Create vitest config**

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
  },
});
```

- [ ] **Step 4: Write a sanity test**

Create `utils/sanity.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';

describe('sanity', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run tests**

Run: `npm test`
Expected: PASS — `1 passed`

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts utils/sanity.test.ts
git commit -m "chore: add vitest for pure-logic unit tests"
```

---

### Task 2: Database migration — `layout_document` column

**Files:**
- Create: `supabase/migrations/20260614120000_add_layout_document_to_setlists.sql`

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/20260614120000_add_layout_document_to_setlists.sql`:
```sql
alter table public.setlists
  add column if not exists layout_document jsonb;
```

- [ ] **Step 2: Apply the migration to the Supabase project**

Use the Supabase MCP `apply_migration` tool (or the Supabase SQL editor) to run the SQL above against the project referenced in `lib/supabaseClient.ts` (project ref `cphfmtnifonekoioktns`). Name the migration `add_layout_document_to_setlists`.

- [ ] **Step 3: Verify the column exists**

Use the Supabase MCP `list_tables` tool (or run `select column_name from information_schema.columns where table_name = 'setlists';` via SQL editor) and confirm `layout_document` is listed.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260614120000_add_layout_document_to_setlists.sql
git commit -m "feat: add layout_document column to setlists"
```

---

### Task 3: Shared text-note style constants

Currently `TEXT_COLORS` and `TEXT_SIZES` are private constants inside `components/SetlistEditor.tsx`. They're needed by the new document utilities too, so extract them.

**Files:**
- Create: `constants/textNoteStyles.ts`
- Modify: `components/SetlistEditor.tsx:65-80` (remove local definitions, import from new module)

- [ ] **Step 1: Create the shared constants module**

Create `constants/textNoteStyles.ts`:
```typescript
export type RGBTuple = [number, number, number];

export const TEXT_COLORS: Record<string, { label: string; hex: string; pdfRgb: RGBTuple; borderRgb: RGBTuple }> = {
  default: { label: 'White', hex: '#94a3b8', pdfRgb: [50, 50, 50], borderRgb: [150, 150, 150] },
  amber: { label: 'Amber', hex: '#f59e0b', pdfRgb: [161, 85, 0], borderRgb: [217, 119, 6] },
  cyan: { label: 'Cyan', hex: '#06b6d4', pdfRgb: [0, 120, 150], borderRgb: [8, 145, 178] },
  purple: { label: 'Purple', hex: '#a855f7', pdfRgb: [100, 40, 180], borderRgb: [147, 51, 234] },
  red: { label: 'Red', hex: '#ef4444', pdfRgb: [190, 30, 30], borderRgb: [220, 38, 38] },
};

export const TEXT_SIZES: Record<string, { label: string; description: string; pdfFontSize: number; pdfLineSpacing: number; uiClass: string }> = {
  sm: { label: 'S', description: 'Small', pdfFontSize: 9, pdfLineSpacing: 5, uiClass: 'text-xs' },
  md: { label: 'M', description: 'Medium', pdfFontSize: 12, pdfLineSpacing: 7, uiClass: 'text-sm' },
  lg: { label: 'L', description: 'Large', pdfFontSize: 17, pdfLineSpacing: 10, uiClass: 'text-base font-semibold' },
};
```

- [ ] **Step 2: Update `SetlistEditor.tsx` to import from the shared module**

In `components/SetlistEditor.tsx`, remove lines 65-80 (the `RGBTuple` type and `TEXT_COLORS`/`TEXT_SIZES` constants), and add this import near the top (with the other relative imports, e.g. after the `musicLogic` import on line 34):
```typescript
import { TEXT_COLORS, TEXT_SIZES } from '../constants/textNoteStyles';
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors (other than pre-existing ones, if any — check with `git stash` if unsure).

- [ ] **Step 4: Commit**

```bash
git add constants/textNoteStyles.ts components/SetlistEditor.tsx
git commit -m "refactor: extract text note style constants to shared module"
```

---

### Task 4: Shared types for setlist items and the layout document

Currently `SongItem`, `TextItem`, `SetlistItem` are private types inside `SetlistEditor.tsx`. The new utility modules need them, plus new types for the TipTap JSON document.

**Files:**
- Modify: `types.ts`
- Modify: `components/SetlistEditor.tsx:46-63` (remove local type definitions, import from `types.ts`)

- [ ] **Step 1: Add the new types to `types.ts`**

Append to `types.ts` (after the `SetlistSong` interface):
```typescript
export interface SongItem {
  type: 'song';
  id: string;
  song: Song;
  transpose: number;
}

export interface TextItem {
  type: 'text';
  id: string;
  content: string;
  color: string;
  size: 'sm' | 'md' | 'lg';
}

export type SetlistItem = SongItem | TextItem;

export interface TiptapMark {
  type: string;
  attrs?: Record<string, any>;
}

export interface TiptapNode {
  type: string;
  attrs?: Record<string, any>;
  content?: TiptapNode[];
  text?: string;
  marks?: TiptapMark[];
}

export interface TiptapDoc {
  type: 'doc';
  content: TiptapNode[];
}

export interface SongBlockAttrs {
  setlistSongId: string;
  songId: string;
  transpose: number;
}
```

- [ ] **Step 2: Add `layout_document` to `Setlist`**

In `types.ts`, modify the `Setlist` interface (around line 41-49) to add the new field:
```typescript
export interface Setlist {
  id: string;
  user_id: string;
  group_id?: string | null;
  title: string;
  created_at: string;
  text_notes?: SetlistTextNote[];
  layout_document?: TiptapDoc | null;
  songs?: Song[]; // Optional, used for UI display only
}
```

- [ ] **Step 3: Remove the local type definitions from `SetlistEditor.tsx`**

In `components/SetlistEditor.tsx`, remove lines 46-63 (the `SongItem`, `TextItem`, `SetlistItem` definitions and the `// ── Types ──` comment block).

- [ ] **Step 4: Import the moved types**

In `components/SetlistEditor.tsx` line 3, change:
```typescript
import { Song, Setlist, SetlistTextNote, NotationMode, Group } from '../types';
```
to:
```typescript
import { Song, Setlist, SetlistTextNote, NotationMode, Group, SongItem, TextItem, SetlistItem } from '../types';
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 6: Commit**

```bash
git add types.ts components/SetlistEditor.tsx
git commit -m "refactor: move setlist item types to types.ts, add layout document types"
```

---

## Phase 1 — Pure document utilities

### Task 5: `buildInitialDocument`

Builds the initial TipTap JSON document from a setlist's current items (songs + legacy text notes).

**Files:**
- Create: `utils/setlistDocument.ts`
- Create: `utils/setlistDocument.test.ts`
- Delete: `utils/sanity.test.ts`

- [ ] **Step 1: Write the failing test**

Create `utils/setlistDocument.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { buildInitialDocument } from './setlistDocument';
import { SetlistItem, Song } from '../types';

const makeSong = (id: string): Song => ({
  id,
  title: `Song ${id}`,
  artist: 'Artist',
  bpm: 120,
  key: 'C',
  content: '[Verse]\n[C]Hello',
  is_public: false,
});

describe('buildInitialDocument', () => {
  it('wraps song items in songBlock nodes with empty paragraphs around them', () => {
    const items: SetlistItem[] = [
      { type: 'song', id: 'ss1', song: makeSong('s1'), transpose: 0 },
      { type: 'song', id: 'ss2', song: makeSong('s2'), transpose: 2 },
    ];
    const doc = buildInitialDocument(items);

    expect(doc.type).toBe('doc');
    expect(doc.content[0]).toEqual({ type: 'paragraph' });
    expect(doc.content[1]).toEqual({
      type: 'songBlock',
      attrs: { setlistSongId: 'ss1', songId: 's1', transpose: 0 },
    });
    expect(doc.content[2]).toEqual({ type: 'paragraph' });
    expect(doc.content[3]).toEqual({
      type: 'songBlock',
      attrs: { setlistSongId: 'ss2', songId: 's2', transpose: 2 },
    });
    expect(doc.content[4]).toEqual({ type: 'paragraph' });
  });

  it('converts a "lg" text note into an H1 heading with its color as a textStyle mark', () => {
    const items: SetlistItem[] = [
      { type: 'text', id: 'txt1', content: 'Set 1', color: 'amber', size: 'lg' },
    ];
    const doc = buildInitialDocument(items);

    expect(doc.content[1]).toEqual({
      type: 'heading',
      attrs: { level: 1 },
      content: [
        { type: 'text', text: 'Set 1', marks: [{ type: 'textStyle', attrs: { color: '#f59e0b' } }] },
      ],
    });
  });

  it('converts a "sm" text note with default color into a plain paragraph (no marks)', () => {
    const items: SetlistItem[] = [
      { type: 'text', id: 'txt1', content: 'Note', color: 'default', size: 'sm' },
    ];
    const doc = buildInitialDocument(items);

    expect(doc.content[1]).toEqual({
      type: 'paragraph',
      content: [{ type: 'text', text: 'Note' }],
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- setlistDocument`
Expected: FAIL — `Cannot find module './setlistDocument'`

- [ ] **Step 3: Implement `buildInitialDocument`**

Create `utils/setlistDocument.ts`:
```typescript
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- setlistDocument`
Expected: PASS — `3 passed`

- [ ] **Step 5: Remove the sanity test**

```bash
rm utils/sanity.test.ts
```

- [ ] **Step 6: Run full test suite**

Run: `npm test`
Expected: PASS — `3 passed` (sanity test no longer present)

- [ ] **Step 7: Commit**

```bash
git add utils/setlistDocument.ts utils/setlistDocument.test.ts
git rm utils/sanity.test.ts
git commit -m "feat: build initial layout document from setlist items"
```

---

### Task 6: `getSongBlockIds` and `removeOrphanSongBlocks`

Used to detect reordering (diffing song block order) and to drop song blocks whose underlying `setlist_songs` row no longer exists.

**Files:**
- Modify: `utils/setlistDocument.ts`
- Modify: `utils/setlistDocument.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `utils/setlistDocument.test.ts`:
```typescript
import { getSongBlockIds, removeOrphanSongBlocks } from './setlistDocument';
import { TiptapDoc } from '../types';

describe('getSongBlockIds', () => {
  it('returns setlistSongId of songBlock nodes in document order', () => {
    const doc: TiptapDoc = {
      type: 'doc',
      content: [
        { type: 'paragraph' },
        { type: 'songBlock', attrs: { setlistSongId: 'a', songId: 's-a', transpose: 0 } },
        { type: 'paragraph' },
        { type: 'songBlock', attrs: { setlistSongId: 'b', songId: 's-b', transpose: 0 } },
      ],
    };
    expect(getSongBlockIds(doc)).toEqual(['a', 'b']);
  });

  it('returns an empty array when there are no song blocks', () => {
    const doc: TiptapDoc = { type: 'doc', content: [{ type: 'paragraph' }] };
    expect(getSongBlockIds(doc)).toEqual([]);
  });
});

describe('removeOrphanSongBlocks', () => {
  it('removes songBlock nodes whose setlistSongId is not in the valid set', () => {
    const doc: TiptapDoc = {
      type: 'doc',
      content: [
        { type: 'paragraph' },
        { type: 'songBlock', attrs: { setlistSongId: 'a', songId: 's-a', transpose: 0 } },
        { type: 'paragraph' },
        { type: 'songBlock', attrs: { setlistSongId: 'b', songId: 's-b', transpose: 0 } },
      ],
    };
    const result = removeOrphanSongBlocks(doc, new Set(['a']));
    expect(getSongBlockIds(result)).toEqual(['a']);
    expect(result.content).toHaveLength(3);
  });

  it('keeps the document unchanged when all song blocks are valid', () => {
    const doc: TiptapDoc = {
      type: 'doc',
      content: [{ type: 'songBlock', attrs: { setlistSongId: 'a', songId: 's-a', transpose: 0 } }],
    };
    const result = removeOrphanSongBlocks(doc, new Set(['a']));
    expect(result).toEqual(doc);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- setlistDocument`
Expected: FAIL — `getSongBlockIds is not a function` / `removeOrphanSongBlocks is not a function`

- [ ] **Step 3: Implement both functions**

Append to `utils/setlistDocument.ts`:
```typescript
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- setlistDocument`
Expected: PASS — `7 passed`

- [ ] **Step 5: Commit**

```bash
git add utils/setlistDocument.ts utils/setlistDocument.test.ts
git commit -m "feat: add song block id helpers for reorder/cleanup sync"
```

---

## Phase 2 — PDF rendering

### Task 7: Extract song-block PDF rendering into `utils/pdfRender.ts`

Moves the existing per-song rendering logic (and `sanitizePdfText`) out of `SetlistEditor.tsx`'s `exportToPDF` into a reusable, context-based function — **without changing `SetlistEditor.tsx` yet** (that happens in Task 11/21). This keeps the extraction mechanical and low-risk.

**Files:**
- Create: `utils/pdfRender.ts`
- Create: `utils/pdfRender.test.ts`

- [ ] **Step 1: Write the failing test for `sanitizePdfText`**

Create `utils/pdfRender.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { sanitizePdfText } from './pdfRender';

describe('sanitizePdfText', () => {
  it('replaces curly quotes with straight quotes', () => {
    expect(sanitizePdfText('don’t')).toBe("don't");
    expect(sanitizePdfText('“hello”')).toBe('"hello"');
  });

  it('collapses special whitespace and expands tabs', () => {
    expect(sanitizePdfText('a b\tc')).toBe('a b    c');
  });

  it('strips accents via NFD normalization', () => {
    expect(sanitizePdfText('café écran')).toBe('cafe ecran');
  });

  it('replaces œ/Œ ligatures and ellipsis', () => {
    expect(sanitizePdfText('œuvre… Œuf')).toBe('oeuvre... Oeuf');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- pdfRender`
Expected: FAIL — `Cannot find module './pdfRender'`

- [ ] **Step 3: Implement `sanitizePdfText`, `PdfContext`, `startNewPage`, and `renderSongToPdf`**

Create `utils/pdfRender.ts`:
```typescript
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- pdfRender`
Expected: PASS — `4 passed`

- [ ] **Step 5: Commit**

```bash
git add utils/pdfRender.ts utils/pdfRender.test.ts
git commit -m "feat: extract reusable song-to-PDF renderer"
```

---

### Task 8: Paragraph text-layout utilities (flatten, tokenize, wrap)

Pure helpers that turn a TipTap paragraph/heading node into word-wrapped lines of styled tokens, given a width-measuring function. Used by `renderTextNodeToPdf` (Task 9).

**Files:**
- Create: `utils/setlistDocumentText.ts`
- Create: `utils/setlistDocumentText.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `utils/setlistDocumentText.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { flattenParagraphRuns, tokenizeRuns, wrapTokensToLines, hexToRgb, TextToken } from './setlistDocumentText';
import { TiptapNode } from '../types';

describe('flattenParagraphRuns', () => {
  it('extracts text runs with bold/italic flags and color from marks', () => {
    const node: TiptapNode = {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Hello ' },
        { type: 'text', text: 'world', marks: [{ type: 'bold' }, { type: 'textStyle', attrs: { color: '#f59e0b' } }] },
      ],
    };
    expect(flattenParagraphRuns(node)).toEqual([
      { text: 'Hello ', bold: false, italic: false, color: null },
      { text: 'world', bold: true, italic: false, color: [245, 158, 11] },
    ]);
  });

  it('returns an empty array for a paragraph with no content', () => {
    expect(flattenParagraphRuns({ type: 'paragraph' })).toEqual([]);
  });
});

describe('tokenizeRuns', () => {
  it('splits runs into word and whitespace tokens preserving style', () => {
    const tokens = tokenizeRuns([{ text: 'Hello world', bold: false, italic: false, color: null }]);
    expect(tokens.map((t) => t.text)).toEqual(['Hello', ' ', 'world']);
  });
});

describe('wrapTokensToLines', () => {
  const measure = (text: string) => text.length;

  it('wraps tokens onto multiple lines once maxWidth is exceeded', () => {
    const tokens: TextToken[] = tokenizeRuns([{ text: 'one two three', bold: false, italic: false, color: null }]);
    const lines = wrapTokensToLines(tokens, 7, measure);
    expect(lines.map((line) => line.map((t) => t.text).join(''))).toEqual(['one two', 'three']);
  });

  it('returns an empty array for no tokens', () => {
    expect(wrapTokensToLines([], 100, measure)).toEqual([]);
  });
});

describe('hexToRgb', () => {
  it('converts a hex color to an RGB tuple', () => {
    expect(hexToRgb('#f59e0b')).toEqual([245, 158, 11]);
  });

  it('returns null for an invalid hex string', () => {
    expect(hexToRgb('not-a-color')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- setlistDocumentText`
Expected: FAIL — `Cannot find module './setlistDocumentText'`

- [ ] **Step 3: Implement the module**

Create `utils/setlistDocumentText.ts`:
```typescript
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- setlistDocumentText`
Expected: PASS — `6 passed`

- [ ] **Step 5: Commit**

```bash
git add utils/setlistDocumentText.ts utils/setlistDocumentText.test.ts
git commit -m "feat: add pure text-layout helpers for PDF paragraph rendering"
```

---

### Task 9: `renderTextNodeToPdf`

Renders a paragraph/heading/list TipTap node to the jsPDF document, using the wrapping helpers from Task 8.

**Files:**
- Modify: `utils/pdfRender.ts`

- [ ] **Step 1: Implement `renderTextNodeToPdf` and `renderParagraphToPdf`**

Append to `utils/pdfRender.ts`:
```typescript
import { TiptapNode } from '../types';
import { flattenParagraphRuns, tokenizeRuns, wrapTokensToLines, TextToken } from './setlistDocumentText';

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
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add utils/pdfRender.ts
git commit -m "feat: render TipTap text nodes (paragraphs, headings, lists) to PDF"
```

---

### Task 10: `exportLayoutDocumentToPdf`

Walks the full layout document, dispatching to `renderSongToPdf` (Task 7) for song blocks and `renderTextNodeToPdf` (Task 9) for everything else.

**Files:**
- Create: `utils/setlistDocumentPdf.ts`
- Create: `utils/setlistDocumentPdf.test.ts`

- [ ] **Step 1: Write the failing test**

Create `utils/setlistDocumentPdf.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { exportLayoutDocumentToPdf } from './setlistDocumentPdf';
import { SetlistItem, Song, TiptapDoc } from '../types';

const makeSong = (id: string): Song => ({
  id,
  title: `Song ${id}`,
  artist: 'Artist',
  bpm: 120,
  key: 'C',
  content: '[Verse]\n[C]Hello world',
  is_public: false,
});

describe('exportLayoutDocumentToPdf', () => {
  it('renders a document with a heading and a song block without throwing', () => {
    const items: SetlistItem[] = [
      { type: 'song', id: 'ss1', song: makeSong('s1'), transpose: 1 },
    ];
    const doc: TiptapDoc = {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Gig title' }] },
        { type: 'songBlock', attrs: { setlistSongId: 'ss1', songId: 's1', transpose: 1 } },
      ],
    };

    const pdf = exportLayoutDocumentToPdf(doc, items, 'My Setlist');
    expect(pdf.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });

  it('skips songBlock nodes whose setlistSongId has no matching setlist item', () => {
    const doc: TiptapDoc = {
      type: 'doc',
      content: [{ type: 'songBlock', attrs: { setlistSongId: 'missing', songId: 's1', transpose: 0 } }],
    };

    expect(() => exportLayoutDocumentToPdf(doc, [], 'My Setlist')).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- setlistDocumentPdf`
Expected: FAIL — `Cannot find module './setlistDocumentPdf'`

- [ ] **Step 3: Implement `exportLayoutDocumentToPdf`**

Create `utils/setlistDocumentPdf.ts`:
```typescript
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- setlistDocumentPdf`
Expected: PASS — `2 passed`

- [ ] **Step 5: Run full test suite**

Run: `npm test`
Expected: all tests pass (sanity test from Task 1 already removed).

- [ ] **Step 6: Commit**

```bash
git add utils/setlistDocumentPdf.ts utils/setlistDocumentPdf.test.ts
git commit -m "feat: render a full layout document to a PDF"
```

---

## Phase 3 — TipTap editor

### Task 11: Install TipTap dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install TipTap v3 and required extensions**

Run:
```bash
npm install @tiptap/react@^3.26.1 @tiptap/core@^3.26.1 @tiptap/pm@^3.26.1 @tiptap/starter-kit@^3.26.1 @tiptap/extension-text-align@^3.26.1 @tiptap/extension-text-style@^3.26.1 @tiptap/extension-color@^3.26.1 @tiptap/extension-underline@^3.26.1
```
Expected: installs without peer-dependency errors (TipTap v3 supports React 19).

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add TipTap rich text editor dependencies"
```

---

### Task 12: `songBlock` TipTap node + locked NodeView

**Files:**
- Create: `components/setlist-document/SongLookupContext.ts`
- Create: `components/setlist-document/SongBlockActionsContext.ts`
- Create: `components/setlist-document/SongBlockNode.tsx`
- Create: `components/setlist-document/SongBlockView.tsx`

- [ ] **Step 1: Create the song lookup context**

Create `components/setlist-document/SongLookupContext.ts`:
```typescript
import { createContext } from 'react';
import { Song } from '../../types';

export const SongLookupContext = createContext<Map<string, Song>>(new Map());
```

- [ ] **Step 2: Create the song block actions context**

Create `components/setlist-document/SongBlockActionsContext.ts`:
```typescript
import { createContext } from 'react';

export interface SongBlockActions {
  onRemove: (setlistSongId: string) => void;
  onTransposeChange: (setlistSongId: string, newTranspose: number) => void;
}

export const SongBlockActionsContext = createContext<SongBlockActions>({
  onRemove: () => {},
  onTransposeChange: () => {},
});
```

- [ ] **Step 3: Create the NodeView component**

Create `components/setlist-document/SongBlockView.tsx`:
```tsx
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
        className="my-2 p-3 rounded-lg border border-dashed border-red-400 text-red-500 text-sm"
        contentEditable={false}
      >
        Chanson introuvable
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper
      className="my-2 flex items-center gap-3 p-3 rounded-lg border border-slate-300 bg-slate-100 text-slate-800"
      contentEditable={false}
    >
      <span data-drag-handle className="cursor-grab text-slate-400 shrink-0">
        <GripVertical size={16} />
      </span>
      <Lock size={14} className="text-slate-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="font-bold truncate">{song.title}</div>
        <div className="text-xs text-slate-500 truncate">{song.artist} • {song.key}</div>
      </div>
      <div className="flex items-center border border-slate-300 rounded shrink-0">
        <button type="button" onClick={() => changeTranspose(-1)} className="p-1 hover:bg-slate-200">
          <Minus size={12} />
        </button>
        <div className="w-8 text-center text-xs font-mono font-bold">
          {transpose > 0 ? '+' : ''}{transpose}
        </div>
        <button type="button" onClick={() => changeTranspose(1)} className="p-1 hover:bg-slate-200">
          <Plus size={12} />
        </button>
      </div>
      <button type="button" onClick={() => actions.onRemove(setlistSongId)} className="p-1 text-slate-400 hover:text-red-500 shrink-0">
        <X size={16} />
      </button>
    </NodeViewWrapper>
  );
};
```

- [ ] **Step 4: Create the node extension**

Create `components/setlist-document/SongBlockNode.tsx`:
```typescript
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
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 6: Commit**

```bash
git add components/setlist-document/SongLookupContext.ts components/setlist-document/SongBlockActionsContext.ts components/setlist-document/SongBlockNode.tsx components/setlist-document/SongBlockView.tsx
git commit -m "feat: add locked songBlock TipTap node"
```

---

### Task 13: Formatting toolbar

**Files:**
- Create: `components/setlist-document/DocumentToolbar.tsx`

- [ ] **Step 1: Implement the toolbar**

Create `components/setlist-document/DocumentToolbar.tsx`:
```tsx
import React from 'react';
import { Editor } from '@tiptap/react';
import {
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Heading1, Heading2, Heading3, Music,
} from 'lucide-react';
import { TEXT_COLORS } from '../../constants/textNoteStyles';

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
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add components/setlist-document/DocumentToolbar.tsx
git commit -m "feat: add formatting toolbar for the document editor"
```

---

### Task 14: `SetlistDocumentEditor` — base setup, init, page styling

**Files:**
- Create: `components/setlist-document/SetlistDocumentEditor.tsx`

- [ ] **Step 1: Implement the base component**

Create `components/setlist-document/SetlistDocumentEditor.tsx`:
```tsx
import React, { useEffect, useMemo, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { Song, Setlist, SetlistItem, SongItem, TiptapDoc } from '../../types';
import { supabase } from '../../lib/supabaseClient';
import { SongBlock } from './SongBlockNode';
import { SongLookupContext } from './SongLookupContext';
import { SongBlockActionsContext, SongBlockActions } from './SongBlockActionsContext';
import { DocumentToolbar } from './DocumentToolbar';
import { buildInitialDocument, getSongBlockIds, removeOrphanSongBlocks } from '../../utils/setlistDocument';

interface SetlistDocumentEditorProps {
  setlist: Setlist;
  setlistItems: SetlistItem[];
  allSongs: Song[];
  onSongOrderChange: (orderedSetlistSongIds: string[]) => void;
  onSongRemoved: (setlistSongId: string) => void;
  onSongTransposeChange: (setlistSongId: string, newTranspose: number) => void;
  onSongInserted: (item: SongItem) => void;
  onLayoutDocumentChange: (doc: TiptapDoc) => void;
}

const extensions = [
  StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
  Underline,
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  TextStyle,
  Color,
  SongBlock,
];

const buildInitialContent = (setlist: Setlist, setlistItems: SetlistItem[]): { doc: TiptapDoc; needsPersist: boolean } => {
  const validIds = new Set(setlistItems.filter((item) => item.type === 'song').map((item) => item.id));
  const existing = setlist.layout_document;

  if (existing) {
    const cleaned = removeOrphanSongBlocks(existing, validIds);
    return { doc: cleaned, needsPersist: JSON.stringify(cleaned) !== JSON.stringify(existing) };
  }

  return { doc: buildInitialDocument(setlistItems), needsPersist: true };
};

export const SetlistDocumentEditor: React.FC<SetlistDocumentEditorProps> = ({
  setlist, setlistItems, allSongs, onSongOrderChange, onSongRemoved, onSongTransposeChange, onSongInserted, onLayoutDocumentChange,
}) => {
  const songLookup = useMemo(() => {
    const map = new Map<string, Song>();
    allSongs.forEach((song) => map.set(song.id, song));
    return map;
  }, [allSongs]);

  const actions = useMemo<SongBlockActions>(() => ({
    onRemove: onSongRemoved,
    onTransposeChange: onSongTransposeChange,
  }), [onSongRemoved, onSongTransposeChange]);

  const prevSongBlockIds = useRef<string[]>([]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initialContent = useMemo(() => buildInitialContent(setlist, setlistItems), [setlist.id]);

  useEffect(() => {
    prevSongBlockIds.current = getSongBlockIds(initialContent.doc);
    if (initialContent.needsPersist) {
      supabase
        .from('setlists')
        .update({ layout_document: initialContent.doc })
        .eq('id', setlist.id)
        .then(() => onLayoutDocumentChange(initialContent.doc));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setlist.id]);

  const persistDocument = (doc: TiptapDoc) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await supabase.from('setlists').update({ layout_document: doc }).eq('id', setlist.id);
      onLayoutDocumentChange(doc);
    }, 1500);
  };

  const editor = useEditor({
    extensions,
    content: initialContent.doc as any,
    onUpdate: ({ editor }) => {
      const doc = editor.getJSON() as TiptapDoc;

      const newIds = getSongBlockIds(doc);
      const prevIds = prevSongBlockIds.current;
      const sameSet = newIds.length === prevIds.length
        && new Set(newIds).size === new Set(prevIds).size
        && newIds.every((id) => prevIds.includes(id));
      if (sameSet && JSON.stringify(newIds) !== JSON.stringify(prevIds)) {
        onSongOrderChange(newIds);
      }
      prevSongBlockIds.current = newIds;

      persistDocument(doc);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setlist.id]);

  if (!editor) return null;

  return (
    <div className="flex-1 overflow-y-auto pb-10">
      <SongLookupContext.Provider value={songLookup}>
        <SongBlockActionsContext.Provider value={actions}>
          <DocumentToolbar editor={editor} onInsertSong={() => {}} />
          {setlistItems.length === 0 && (
            <p className="text-center text-sm text-slate-500 mb-3">
              Ajoutez des chansons depuis la vue Liste ou via le bouton "Insérer une chanson".
            </p>
          )}
          <div
            className="mx-auto bg-white text-slate-900 shadow-2xl rounded-sm prose"
            style={{ width: '210mm', minHeight: '297mm', padding: '20mm', maxWidth: '100%' }}
          >
            <EditorContent editor={editor} />
          </div>
        </SongBlockActionsContext.Provider>
      </SongLookupContext.Provider>
    </div>
  );
};
```

Note: `onSongInserted` is accepted as a prop but not used yet — it's wired up in Task 16. TypeScript will flag it as an unused variable; that's expected and resolved in that task (do not remove it from the props interface).

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: one warning/error about `onSongInserted` being unused (TS6133 if `noUnusedParameters` is on) — if so, prefix it with an underscore temporarily is NOT desired; instead check `tsconfig.json` for `noUnusedParameters`. If it's enabled and causes a build error, destructure it last and reference it in a no-op: add `void onSongInserted;` as the first line of the component body to silence it until Task 16. If `noUnusedParameters` is off (check `tsconfig.json`), no action needed.

- [ ] **Step 3: Commit**

```bash
git add components/setlist-document/SetlistDocumentEditor.tsx
git commit -m "feat: add SetlistDocumentEditor base component"
```

---

### Task 15: Song reorder, removal, and transpose sync handlers in `SetlistEditor`

Wires the editor's callbacks to the existing setlist mutation functions, keeping the "Liste" view's `setlistItems`/`setlist_songs` in sync with reorders/removals/transposes made in the "Document" view.

**Files:**
- Modify: `components/SetlistEditor.tsx`

- [ ] **Step 1: Add the sync handlers**

In `components/SetlistEditor.tsx`, add the following near `updateAllPositions` (after its definition, around line 476):
```typescript
const handleDocumentSongOrderChange = async (orderedSetlistSongIds: string[]) => {
  const songItemsById = new Map(
    setlistItems.filter((item): item is SongItem => item.type === 'song').map((item) => [item.id, item])
  );
  const textItems = setlistItems.filter((item) => item.type === 'text');
  const reorderedSongs = orderedSetlistSongIds
    .map((id) => songItemsById.get(id))
    .filter((item): item is SongItem => item !== undefined);

  const newItems: SetlistItem[] = [...reorderedSongs, ...textItems];
  setSetlistItems(newItems);
  await updateAllPositions(newItems);
};

const handleDocumentSongInserted = (newItem: SongItem) => {
  setSetlistItems((items) => [...items, newItem]);
};

const handleLayoutDocumentChange = (doc: TiptapDoc) => {
  setCurrentSetlist((prev) => (prev ? { ...prev, layout_document: doc } : prev));
};
```

- [ ] **Step 2: Import `TiptapDoc`**

In `components/SetlistEditor.tsx` line 3, add `TiptapDoc` to the import from `../types`:
```typescript
import { Song, Setlist, SetlistTextNote, NotationMode, Group, SongItem, TextItem, SetlistItem, TiptapDoc } from '../types';
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors (the new handlers are unused until Task 16, which may produce a "declared but never used" error for `handleDocumentSongOrderChange`, `handleDocumentSongInserted`, `handleLayoutDocumentChange` if `noUnusedLocals` is on — check `tsconfig.json`; if enabled, this is expected to be resolved in Task 16 and is acceptable as a transient state for this task).

- [ ] **Step 4: Commit**

```bash
git add components/SetlistEditor.tsx
git commit -m "feat: add document-to-setlist sync handlers"
```

---

### Task 16: Insert-song picker

Adds the song picker modal to `SetlistDocumentEditor` and wires up "Insérer une chanson".

**Files:**
- Modify: `components/setlist-document/SetlistDocumentEditor.tsx`

- [ ] **Step 1: Add picker state and the insert handler**

In `components/setlist-document/SetlistDocumentEditor.tsx`:

1. Add to the imports:
```typescript
import { useEditor, EditorContent } from '@tiptap/react';
```
(already present — no change needed here, just confirm it's there)

Add `useState` to the React import:
```typescript
import React, { useEffect, useMemo, useRef, useState } from 'react';
```

Add `Search, X` to a new lucide-react import:
```typescript
import { Search, X } from 'lucide-react';
```

2. Inside the component, after the `editor` declaration, add:
```typescript
  const [showSongPicker, setShowSongPicker] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');

  const handleInsertSong = async (song: Song) => {
    const { data, error } = await supabase
      .from('setlist_songs')
      .insert({ setlist_id: setlist.id, song_id: song.id, position: setlistItems.length, transpose: 0 })
      .select()
      .single();

    if (error || !data || !editor) return;

    onSongInserted({ type: 'song', id: data.id, song, transpose: 0 });
    editor.chain()
      .focus()
      .insertContent({ type: 'songBlock', attrs: { setlistSongId: data.id, songId: song.id, transpose: 0 } })
      .insertContent({ type: 'paragraph' })
      .run();
    setShowSongPicker(false);
    setPickerQuery('');
  };
```

- [ ] **Step 2: Wire the toolbar button and render the picker modal**

Change:
```tsx
<DocumentToolbar editor={editor} onInsertSong={() => {}} />
```
to:
```tsx
<DocumentToolbar editor={editor} onInsertSong={() => setShowSongPicker(true)} />
```

Then, right after the closing `</div>` of the page (`<EditorContent editor={editor} />`'s wrapper `</div>`), and before `</SongBlockActionsContext.Provider>`, add the modal:
```tsx
{showSongPicker && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 w-full max-w-md max-h-[80vh] flex flex-col">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-white font-bold">Insérer une chanson</h3>
        <button onClick={() => setShowSongPicker(false)} className="text-slate-400 hover:text-white">
          <X size={18} />
        </button>
      </div>
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
        <input
          type="text"
          placeholder="Rechercher..."
          value={pickerQuery}
          onChange={(e) => setPickerQuery(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-sm text-slate-300 focus:outline-none focus:border-cyan-500"
        />
      </div>
      <div className="overflow-y-auto space-y-1">
        {allSongs
          .filter((s) => !setlistItems.find((item) => item.type === 'song' && item.song.id === s.id))
          .filter((s) =>
            s.title.toLowerCase().includes(pickerQuery.toLowerCase())
            || s.artist.toLowerCase().includes(pickerQuery.toLowerCase()))
          .slice(0, 30)
          .map((song) => (
            <button
              key={song.id}
              onClick={() => handleInsertSong(song)}
              className="w-full text-left p-2 hover:bg-slate-800 rounded-lg"
            >
              <div className="text-white text-sm font-medium">{song.title}</div>
              <div className="text-xs text-slate-500">{song.artist}</div>
            </button>
          ))}
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 3: Remove the temporary `void onSongInserted;` line if it was added in Task 14**

If Task 14 added `void onSongInserted;` to silence an unused-variable error, remove that line now since `onSongInserted` is used in Step 1.

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add components/setlist-document/SetlistDocumentEditor.tsx
git commit -m "feat: add song picker to insert songs into the document"
```

---

## Phase 4 — Integration into SetlistEditor

### Task 17: "Liste" / "Document" tab toggle

**Files:**
- Modify: `components/SetlistEditor.tsx`

- [ ] **Step 1: Import the new editor component**

Near the top of `components/SetlistEditor.tsx`, with the other component imports (after `import SongEditor from './SongEditor';`):
```typescript
import { SetlistDocumentEditor } from './setlist-document/SetlistDocumentEditor';
```

- [ ] **Step 2: Add the view-mode state**

Near the other `useState` declarations in `SetlistEditor` (around line 193, after `pdfTitle`):
```typescript
const [setlistView, setSetlistView] = useState<'list' | 'document'>('list');
```

Also reset it whenever a different setlist is opened — in `handleSelectSetlist` (around line 384-388), add:
```typescript
const handleSelectSetlist = (setlist: Setlist) => {
  setCurrentSetlist(setlist);
  fetchSetlistItems(setlist.id);
  setPerformanceMode(false);
  setSetlistView('list');
};
```

- [ ] **Step 3: Add the tab toggle to the header**

In the setlist detail header (around line 1014-1060, the `<div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 flex-shrink-0">` block), inside the left-hand group (`<div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">`), after the closing of the title `<div className="flex items-center gap-2 min-w-0">...</div>` block, add the tab toggle (only when not virtual):
```tsx
{!isVirtual && (
  <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 shrink-0">
    <button
      onClick={() => setSetlistView('list')}
      className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${setlistView === 'list' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
    >
      Liste
    </button>
    <button
      onClick={() => setSetlistView('document')}
      className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${setlistView === 'document' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
    >
      Document
    </button>
  </div>
)}
```

- [ ] **Step 4: Render the document editor when selected**

The existing layout (around line 1112) starts with:
```tsx
<div className="flex-1 flex flex-col lg:flex-row gap-6 lg:gap-8 overflow-visible lg:overflow-hidden pb-10">
```
and contains the "Setlist Order" panel and the "Song Library" panel.

Wrap this whole block (from `<div className="flex-1 flex flex-col lg:flex-row gap-6 lg:gap-8 overflow-visible lg:overflow-hidden pb-10">` down to its matching closing `</div>`, i.e. lines 1112-1289) with a conditional, and add the document editor as the alternative branch:
```tsx
{setlistView === 'list' || isVirtual ? (
  <div className="flex-1 flex flex-col lg:flex-row gap-6 lg:gap-8 overflow-visible lg:overflow-hidden pb-10">
    {/* ... existing content unchanged ... */}
  </div>
) : (
  <SetlistDocumentEditor
    setlist={currentSetlist}
    setlistItems={setlistItems}
    allSongs={allSongs}
    onSongOrderChange={handleDocumentSongOrderChange}
    onSongRemoved={removeItemFromSetlist}
    onSongTransposeChange={updateItemTranspose}
    onSongInserted={handleDocumentSongInserted}
    onLayoutDocumentChange={handleLayoutDocumentChange}
  />
)}
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 6: Manual check**

Run: `npm run dev`, open a non-virtual setlist with at least one song, click "Document". Expected: the page loads, shows an A4-styled white page with the song(s) rendered as locked grey blocks and empty paragraphs around them. Switching back to "Liste" shows the unchanged list view.

- [ ] **Step 7: Commit**

```bash
git add components/SetlistEditor.tsx
git commit -m "feat: add Liste/Document tab toggle to the setlist editor"
```

---

### Task 18: Wire "Exporter PDF" to the layout document

Replaces the old `exportToPDF` implementation with one based on `exportLayoutDocumentToPdf` (Task 10), using `currentSetlist.layout_document` if present, otherwise building one on the fly.

**Files:**
- Modify: `components/SetlistEditor.tsx`

- [ ] **Step 1: Replace the `exportToPDF` function body**

Replace the entire `exportToPDF` function (currently lines ~510-658, from `const exportToPDF = () => {` through its closing `};`) with:
```typescript
const exportToPDF = () => {
  if (!currentSetlist || setlistItems.length === 0) return;
  setShowPdfModal(false);

  const layoutDoc = currentSetlist.layout_document ?? buildInitialDocument(setlistItems);
  const doc = exportLayoutDocumentToPdf(layoutDoc, setlistItems, pdfTitle);
  doc.save(`${pdfTitle}.pdf`);
};
```

- [ ] **Step 2: Update imports**

In `components/SetlistEditor.tsx`:
- Remove the `import { jsPDF } from 'jspdf';` line (no longer used directly).
- Remove `transposeContent, transpose, getSectionType` from the `musicLogic` import if they are no longer used elsewhere in the file. Check with:
  ```bash
  grep -n "transposeContent\|getSectionType\|transpose(" components/SetlistEditor.tsx
  ```
  If `transpose` is still used (e.g. for the key display in the "Setlist Order" list), keep only the ones still referenced. If none remain, remove the whole import line; otherwise keep only the needed names.
- Add:
```typescript
import { buildInitialDocument } from '../utils/setlistDocument';
import { exportLayoutDocumentToPdf } from '../utils/setlistDocumentPdf';
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. If `TEXT_COLORS`/`TEXT_SIZES` (imported in Task 3) are now unused in `SetlistEditor.tsx` because their only use was inside the old `exportToPDF`, check:
```bash
grep -n "TEXT_COLORS\|TEXT_SIZES" components/SetlistEditor.tsx
```
They are still used by the "Setlist Order" list rendering (text note color/size badges) and the text-note edit modal — keep the import. Only remove if `grep` shows zero remaining usages.

- [ ] **Step 4: Manual check**

Run: `npm run dev`. For a setlist that has never opened the "Document" tab (so `layout_document` is `null`), click "Exporter PDF" and confirm the downloaded PDF looks the same as before (songs with chords/sections rendered, any existing text notes rendered as headings/paragraphs). Then open "Document", add a bold heading and a centered paragraph, switch back to "Liste", and export again — confirm the new text appears in the PDF with the right formatting and position.

- [ ] **Step 5: Commit**

```bash
git add components/SetlistEditor.tsx
git commit -m "feat: generate PDF export from the layout document"
```

---

### Task 19: Mobile — replace drag handle with up/down buttons on song blocks

On touch devices, dragging the `data-drag-handle` element conflicts with scrolling. Add explicit move buttons as a fallback, shown only on small screens via Tailwind responsive classes.

**Files:**
- Modify: `components/setlist-document/SongBlockView.tsx`

- [ ] **Step 1: Add move-up/move-down buttons, hidden on `lg` and up**

In `components/setlist-document/SongBlockView.tsx`, the drag handle currently is:
```tsx
<span data-drag-handle className="cursor-grab text-slate-400 shrink-0">
  <GripVertical size={16} />
</span>
```

Replace it with a responsive pair: the grip handle (hidden on small screens) and up/down buttons (hidden on `lg` and above). Add `ChevronUp, ChevronDown` to the lucide-react import, and `useContext`'s `editor`/`getPos` props from `NodeViewProps` to compute swap targets:

Update the component signature to also destructure `getPos`, `editor`:
```tsx
export const SongBlockView: React.FC<NodeViewProps> = ({ node, updateAttributes, getPos, editor }) => {
```

Add this helper inside the component, before the `return`:
```typescript
  const moveBy = (offset: number) => {
    const pos = getPos();
    const $pos = editor.state.doc.resolve(pos);
    const targetIndex = $pos.index($pos.depth) + offset;
    if (targetIndex < 0 || targetIndex >= $pos.parent.childCount) return;

    const targetNode = $pos.parent.child(targetIndex);
    const targetPos = offset > 0
      ? pos + node.nodeSize + targetNode.nodeSize
      : pos - targetNode.nodeSize;

    editor.chain()
      .deleteRange({ from: pos, to: pos + node.nodeSize })
      .insertContentAt(offset > 0 ? targetPos - node.nodeSize : targetPos, node.toJSON())
      .run();
  };
```

Replace the drag handle markup with:
```tsx
<span data-drag-handle className="hidden lg:block cursor-grab text-slate-400 shrink-0">
  <GripVertical size={16} />
</span>
<div className="flex lg:hidden flex-col shrink-0">
  <button type="button" onClick={() => moveBy(-1)} className="p-0.5 text-slate-400 hover:text-slate-700">
    <ChevronUp size={14} />
  </button>
  <button type="button" onClick={() => moveBy(1)} className="p-0.5 text-slate-400 hover:text-slate-700">
    <ChevronDown size={14} />
  </button>
</div>
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Manual check**

Run: `npm run dev`, open the Document view, resize the browser to a mobile width (< 1024px wide). Confirm the drag handle disappears and up/down chevrons appear on each song block; clicking them reorders the block and (after the autosave debounce) updates the "Liste" view's song order too.

- [ ] **Step 4: Commit**

```bash
git add components/setlist-document/SongBlockView.tsx
git commit -m "feat: add mobile up/down reorder controls for song blocks"
```

---

### Task 20: Toolbar horizontal scroll on mobile

**Files:**
- Modify: `components/setlist-document/DocumentToolbar.tsx`

- [ ] **Step 1: Confirm/adjust scroll behavior**

The toolbar container already has `overflow-x-auto` and `flex-wrap`. On narrow screens, `flex-wrap` will wrap buttons onto multiple rows instead of scrolling horizontally, which is also acceptable but can grow tall. Change the wrapping behavior to force a single scrollable row on small screens by replacing:
```tsx
<div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-2 mb-4 overflow-x-auto">
```
with:
```tsx
<div className="sticky top-0 z-10 flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-2 mb-4 overflow-x-auto flex-nowrap lg:flex-wrap">
```

- [ ] **Step 2: Manual check**

Run: `npm run dev`, open the Document view at a mobile width. Confirm the toolbar is a single horizontally-scrollable row, and on desktop width it wraps normally.

- [ ] **Step 3: Commit**

```bash
git add components/setlist-document/DocumentToolbar.tsx
git commit -m "fix: make document toolbar horizontally scrollable on mobile"
```

---

## Phase 5 — Final verification

### Task 21: Full regression pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full automated test suite**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 2: Typecheck the whole project**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manual end-to-end walkthrough**

Run: `npm run dev` and, using the browser:
1. Open an existing setlist with songs and at least one legacy text note → switch to "Document" → confirm songs appear as locked grey blocks in their existing order, and the text note appears as a styled heading/paragraph matching its size/color.
2. Type a new paragraph, make part of it bold and centered, add a bullet list.
3. Drag a song block to reorder it (desktop width) → switch to "Liste" → confirm the order matches.
4. Click the "X" on a song block → confirm it disappears from both the Document and the "Liste" view, and from the Song Library it's now addable again.
5. Use "Insérer une chanson" to add a new song → confirm it appears as a locked block and also appears in "Liste".
6. Click "Exporter PDF" → open the downloaded PDF → confirm: song chords/sections render as before, the new formatted text (heading, bold, centered paragraph, bullet list) renders with correct styling, and the song order matches the document.
7. Reload the page, reopen the setlist, switch to "Document" → confirm all edits persisted.
8. Open the virtual "Favoris" setlist → confirm the "Document" tab is not shown (list view only).

- [ ] **Step 4: Report results**

If any check in Step 3 fails, note which one and stop — do not commit further until it's fixed and re-verified.
