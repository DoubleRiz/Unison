# Setlist Mode Lock (list vs document) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make a setlist's content mode (`list` or `document`) a fixed choice made at creation time, eliminating the drift between `text_notes` and `layout_document` that currently makes the PDF export miss list-mode-only edits.

**Architecture:** Add a `mode` column to `setlists` (default `'list'`), remove the runtime `setlistView` toggle in favor of reading `currentSetlist.mode`, add a mode picker to the setlist creation form, branch PDF export on `mode` (new list-mode PDF renderer vs. existing document-mode renderer), and make duplication copy the source setlist's mode along with the matching content field (remapping `setlistSongId` references when copying a `layout_document`).

**Tech Stack:** React 19 + TypeScript, Supabase (Postgres), jsPDF, TipTap, Vitest.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-12-setlist-mode-lock-design.md` — follow it exactly; this plan implements it task by task.
- Mode is locked forever once a setlist is created — no UI is added anywhere to change `mode` after creation.
- The migration must set `layout_document = NULL` for every existing row (accepted, destructive per spec §1).
- No new test framework — this repo unit-tests only pure functions in `utils/*.ts` via Vitest (`environment: 'node'`, see `vitest.config.ts`). There is no component/DOM test setup, so UI changes in `components/SetlistEditor.tsx` are verified manually (dev server), not via automated tests — this matches the existing repo convention (zero `*.test.tsx` files exist).

---

### Task 1: Database migration — add `mode` column, wipe existing `layout_document`

**Files:**
- Create: `supabase/migrations/20260712160000_add_mode_to_setlists.sql`
- Modify: `types.ts:41-50` (`Setlist` interface)

**Interfaces:**
- Produces: `Setlist.mode: 'list' | 'document'` — a required field every later task reads/writes.

- [ ] **Step 1: Write the migration SQL**

Create `supabase/migrations/20260712160000_add_mode_to_setlists.sql`:

```sql
alter table public.setlists
  add column mode text not null default 'list' check (mode in ('list', 'document'));

update public.setlists set layout_document = null;
```

- [ ] **Step 2: Apply the migration**

This repo has no wired-up Supabase CLI (`supabase/config.toml` does not exist; `package.json` has no `supabase` script) — migrations here are applied manually against the project's Supabase instance. Run the SQL above in the Supabase SQL editor for the project (or via `psql`/CLI if the developer applying this plan has one configured locally). There is no automated way to verify this step from within the repo; confirm manually with:

```sql
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_name = 'setlists' and column_name = 'mode';
```

Expected: one row, `data_type = text`, `is_nullable = NO`, `column_default = 'list'::text`.

- [ ] **Step 3: Update the `Setlist` type**

In `types.ts`, replace the `Setlist` interface (lines 41-50):

```ts
export interface Setlist {
  id: string;
  user_id: string;
  group_id?: string | null;
  title: string;
  created_at: string;
  mode: 'list' | 'document';
  text_notes?: SetlistTextNote[];
  layout_document?: TiptapDoc | null;
  songs?: Song[]; // Optional, used for UI display only
}
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: fails, listing every place a `Setlist` object literal is missing `mode` (this is expected and will be fixed in later tasks — e.g. `favoriteSetlist` in `components/SetlistEditor.tsx:509-514`). Confirm the only errors are about missing `mode` on `Setlist`-typed object literals, not unrelated errors.

- [ ] **Step 5: Fix the virtual "Favorites" setlist literal**

In `components/SetlistEditor.tsx`, find the `favoriteSetlist` constant (around line 509-514):

```ts
const favoriteSetlist: Setlist = {
  id: FAVORITES_ID,
  user_id: user.id,
  title: 'My Favorites',
  created_at: new Date().toISOString()
```

Add `mode: 'list',` to this object (the virtual Favorites list is always list-mode, matching current behavior).

- [ ] **Step 6: Type-check again**

Run: `npx tsc --noEmit`
Expected: no more errors about `Setlist.mode` from `favoriteSetlist`. Any remaining `mode`-related errors are addressed in Tasks 5-8 below (do not fix them here).

- [ ] **Step 7: Commit**

```bash
git add supabase/migrations/20260712160000_add_mode_to_setlists.sql types.ts components/SetlistEditor.tsx
git commit -m "feat: add mode column to setlists, lock virtual favorites to list mode"
```

---

### Task 2: `renderTextNoteToPdf` — render a `SetlistTextNote` to PDF

**Files:**
- Modify: `utils/pdfRender.ts`
- Test: `utils/pdfRender.test.ts`

**Interfaces:**
- Consumes: `PdfContext` (`utils/pdfRender.ts:6-12`), `startNewPage(ctx)` (`utils/pdfRender.ts:16-19`), `TEXT_COLORS`/`TEXT_SIZES` from `constants/textNoteStyles.ts` (each color has `pdfRgb: [number,number,number]`; each size has `pdfFontSize: number`, `pdfLineSpacing: number`).
- Produces: `renderTextNoteToPdf(ctx: PdfContext, note: SetlistTextNote): void` — used by Task 3's `exportSetlistListToPdf`.

This reproduces the pre-document-editor text-note PDF rendering (previously inline in `SetlistEditor.tsx`, removed in commit `e5c83a1`'s predecessor `81c0883`), now built on the shared `PdfContext`/`startNewPage` primitives.

- [ ] **Step 1: Write the failing test**

Add to `utils/pdfRender.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { jsPDF } from 'jspdf';
import { sanitizePdfText, renderTextNoteToPdf, PdfContext } from './pdfRender';
import { SetlistTextNote } from '../types';

describe('renderTextNoteToPdf', () => {
  const makeCtx = (): PdfContext => {
    const doc = new jsPDF();
    return { doc, margin: 15, contentWidth: 180, pageHeight: 297, cursorY: 20 };
  };

  it('advances cursorY after rendering a note', () => {
    const ctx = makeCtx();
    const startY = ctx.cursorY;
    const note: SetlistTextNote = { id: 'n1', content: 'Set break', color: 'amber', size: 'lg', position: 0 };

    renderTextNoteToPdf(ctx, note);

    expect(ctx.cursorY).toBeGreaterThan(startY);
  });

  it('starts a new page when the note would overflow the current page', () => {
    const ctx = makeCtx();
    ctx.cursorY = ctx.pageHeight - ctx.margin - 1;
    const note: SetlistTextNote = { id: 'n1', content: 'Overflow note', color: 'default', size: 'md', position: 0 };
    const pagesBefore = ctx.doc.getNumberOfPages();

    renderTextNoteToPdf(ctx, note);

    expect(ctx.doc.getNumberOfPages()).toBeGreaterThan(pagesBefore);
  });

  it('does not throw for an unknown color or size key', () => {
    const ctx = makeCtx();
    const note = { id: 'n1', content: 'Weird', color: 'nonexistent', size: 'xl' } as unknown as SetlistTextNote;
    expect(() => renderTextNoteToPdf(ctx, note)).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run utils/pdfRender.test.ts`
Expected: FAIL — `renderTextNoteToPdf is not exported` / `is not a function`.

- [ ] **Step 3: Implement `renderTextNoteToPdf`**

In `utils/pdfRender.ts`, add the import and function. Update the top import line (line 1-4):

```ts
import { jsPDF } from 'jspdf';
import { Song, SetlistTextNote, TiptapNode } from '../types';
import { transposeContent, transpose, getSectionType } from './musicLogic';
import { flattenParagraphRuns, tokenizeRuns, wrapTokensToLines, TextToken } from './setlistDocumentText';
import { TEXT_COLORS, TEXT_SIZES } from '../constants/textNoteStyles';
```

Add this function after `renderSongToPdf` (after line 113, before the `FONT_SIZE_NORMAL` constant):

```ts
export const renderTextNoteToPdf = (ctx: PdfContext, note: SetlistTextNote): void => {
  const { doc, margin, contentWidth, pageHeight } = ctx;
  const color = TEXT_COLORS[note.color] || TEXT_COLORS.default;
  const size = TEXT_SIZES[note.size] || TEXT_SIZES.md;

  doc.setFontSize(size.pdfFontSize);
  doc.setTextColor(color.pdfRgb[0], color.pdfRgb[1], color.pdfRgb[2]);
  doc.setFont('helvetica', 'bold');

  const lines = doc.splitTextToSize(sanitizePdfText(note.content), contentWidth);
  const textHeightTotal = lines.length * size.pdfLineSpacing;

  if (ctx.cursorY + textHeightTotal > pageHeight - margin) startNewPage(ctx);

  lines.forEach((line: string) => {
    if (ctx.cursorY > pageHeight - margin) startNewPage(ctx);
    doc.text(line, margin, ctx.cursorY);
    ctx.cursorY += size.pdfLineSpacing;
  });

  ctx.cursorY += 10;
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run utils/pdfRender.test.ts`
Expected: PASS, all tests in the file green.

- [ ] **Step 5: Commit**

```bash
git add utils/pdfRender.ts utils/pdfRender.test.ts
git commit -m "feat: add renderTextNoteToPdf for list-mode PDF export"
```

---

### Task 3: `exportSetlistListToPdf` — PDF export for list-mode setlists

**Files:**
- Create: `utils/setlistListPdf.ts`
- Test: `utils/setlistListPdf.test.ts`

**Interfaces:**
- Consumes: `PdfContext`, `startNewPage`, `renderSongToPdf`, `renderTextNoteToPdf` from `utils/pdfRender.ts` (Task 2); `SetlistItem` from `types.ts`.
- Produces: `exportSetlistListToPdf(setlistItems: SetlistItem[], pdfTitle: string): jsPDF` — used by Task 6 (`exportToPDF` in `SetlistEditor.tsx`).

- [ ] **Step 1: Write the failing test**

Create `utils/setlistListPdf.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { exportSetlistListToPdf } from './setlistListPdf';
import { SetlistItem, Song } from '../types';

const makeSong = (id: string): Song => ({
  id,
  title: `Song ${id}`,
  artist: 'Artist',
  bpm: 120,
  key: 'C',
  content: '[Verse]\n[C]Hello world',
  is_public: false,
});

describe('exportSetlistListToPdf', () => {
  it('renders songs and text notes in order without throwing', () => {
    const items: SetlistItem[] = [
      { type: 'text', id: 't1', content: 'Set 1', color: 'amber', size: 'lg' },
      { type: 'song', id: 'ss1', song: makeSong('s1'), transpose: 0 },
      { type: 'text', id: 't2', content: 'Break', color: 'default', size: 'sm' },
      { type: 'song', id: 'ss2', song: makeSong('s2'), transpose: 2 },
    ];

    const pdf = exportSetlistListToPdf(items, 'My Gig');
    expect(pdf.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });

  it('handles an empty setlist without throwing', () => {
    expect(() => exportSetlistListToPdf([], 'Empty')).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run utils/setlistListPdf.test.ts`
Expected: FAIL — cannot find module `./setlistListPdf`.

- [ ] **Step 3: Implement `exportSetlistListToPdf`**

Create `utils/setlistListPdf.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run utils/setlistListPdf.test.ts`
Expected: PASS.

- [ ] **Step 5: Run the full test suite**

Run: `npm test`
Expected: all test files pass (no regressions in `utils/pdfRender.test.ts`, `utils/setlistDocumentPdf.test.ts`, `utils/setlistDocumentText.test.ts`, `utils/setlistDocument.test.ts`).

- [ ] **Step 6: Commit**

```bash
git add utils/setlistListPdf.ts utils/setlistListPdf.test.ts
git commit -m "feat: add exportSetlistListToPdf for list-mode setlists"
```

---

### Task 4: Creation form — mode picker, default "list"

**Files:**
- Modify: `components/SetlistEditor.tsx`

**Interfaces:**
- Consumes: `Setlist.mode` (Task 1).
- Produces: `newSetlistMode` state read by `handleCreateSetlist`'s insert payload — no other task depends on this state name.

- [ ] **Step 1: Add local state for the picked mode**

Near the existing `newTitle`/`selectedGroupId` state (`components/SetlistEditor.tsx:87-88`):

```ts
const [newTitle, setNewTitle] = useState('');
const [selectedGroupId, setSelectedGroupId] = useState<string>('');
const [newSetlistMode, setNewSetlistMode] = useState<'list' | 'document'>('list');
```

- [ ] **Step 2: Include `mode` in the insert payload**

In `handleCreateSetlist` (`components/SetlistEditor.tsx:252-264`):

```ts
const handleCreateSetlist = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!newTitle.trim()) return;
  const payload: any = { title: newTitle, user_id: user.id, mode: newSetlistMode };
  if (selectedGroupId) payload.group_id = selectedGroupId;
  const { data, error } = await supabase.from('setlists').insert([payload]).select().single();
  if (!error && data) {
    setSetlists([data, ...setlists]);
    setNewTitle('');
    setSelectedGroupId('');
    setNewSetlistMode('list');
    handleSelectSetlist(data);
  }
};
```

- [ ] **Step 3: Add the mode picker to the creation form**

In the "Create New Setlist" form (`components/SetlistEditor.tsx:673-689`), add a segmented control between the title input and the submit button:

```tsx
<form onSubmit={handleCreateSetlist} className="flex flex-col sm:flex-row gap-3">
  <input type="text" placeholder="Gig at The Pub..." value={newTitle}
    onChange={(e) => setNewTitle(e.target.value)}
    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 sm:py-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500" />
  <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1 shrink-0">
    <button
      type="button"
      onClick={() => setNewSetlistMode('list')}
      className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${newSetlistMode === 'list' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
    >
      Liste
    </button>
    <button
      type="button"
      onClick={() => setNewSetlistMode('document')}
      className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${newSetlistMode === 'document' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
    >
      Document
    </button>
  </div>
  {groups.length > 0 && (
    <div className="flex-1 sm:flex-none sm:w-48">
      <select value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)}
        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 sm:py-2 text-white focus:outline-none focus:border-cyan-500 appearance-none">
        <option value="">Personal</option>
        {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
      </select>
    </div>
  )}
  <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 sm:py-2 rounded-lg flex items-center justify-center gap-2 font-bold shadow-lg shadow-cyan-900/20 active:scale-95 transition-all">
    <Plus size={20} /> Create
  </button>
</form>
```

Note the `type="button"` on both mode buttons — required so they don't submit the form when clicked.

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors introduced by this task (errors about `mode` in `executeDuplicateSetlist`/`SetlistDocumentEditor`-adjacent code, if any remain, are addressed in later tasks).

- [ ] **Step 5: Manual verification**

Run: `npm run dev`
In the browser: open the Setlists view, confirm "Liste" is pre-selected by default in the "Create New Setlist" form, create one setlist leaving "Liste" selected and one after clicking "Document". Confirm both rows appear in the Supabase `setlists` table with the expected `mode` value (`select id, title, mode from setlists order by created_at desc limit 2;`).

- [ ] **Step 6: Commit**

```bash
git add components/SetlistEditor.tsx
git commit -m "feat: let users pick list or document mode when creating a setlist"
```

---

### Task 5: Lock the mode — remove the Liste/Document toggle

**Files:**
- Modify: `components/SetlistEditor.tsx`

**Interfaces:**
- Consumes: `Setlist.mode` (Task 1).
- Produces: view branch driven by `currentSetlist.mode` — Task 6 (export) and Task 7 (duplication) build on the same field, no new symbol produced for other tasks.

- [ ] **Step 1: Remove the `setlistView` state and stop forcing it on selection**

Delete the state declaration (`components/SetlistEditor.tsx:161`):

```ts
const [setlistView, setSetlistView] = useState<'list' | 'document'>('list');
```

In `handleSelectSetlist` (`components/SetlistEditor.tsx:351-356`), remove the now-meaningless line:

```ts
const handleSelectSetlist = (setlist: Setlist) => {
  setCurrentSetlist(setlist);
  fetchSetlistItems(setlist.id);
  setPerformanceMode(false);
};
```

(the `setSetlistView('list')` call is deleted — there is no more mutable view state to reset.)

- [ ] **Step 2: Remove the toggle buttons**

Delete the toggle block (`components/SetlistEditor.tsx:910-925`):

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

- [ ] **Step 3: Derive the rendered view from `currentSetlist.mode`**

Change the view branch condition (`components/SetlistEditor.tsx:978`):

```tsx
{currentSetlist.mode === 'list' || isVirtual ? (
```

(replacing `{setlistView === 'list' || isVirtual ? (`). The rest of that conditional block and its `SetlistDocumentEditor` else-branch (lines 979-1169) are unchanged.

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors referencing `setlistView` (confirms every usage was removed).

- [ ] **Step 5: Manual verification**

Run: `npm run dev`. Open a `list`-mode setlist — confirm it shows the list/library UI with no mode toggle visible. Open a `document`-mode setlist — confirm it shows the TipTap document editor directly, also with no toggle. Confirm the virtual "Favoris" list still renders as before (list UI, no toggle — unchanged, `isVirtual` still short-circuits the condition).

- [ ] **Step 6: Commit**

```bash
git add components/SetlistEditor.tsx
git commit -m "feat: lock setlist view to its mode, remove list/document toggle"
```

---

### Task 6: Branch PDF export on `mode`

**Files:**
- Modify: `components/SetlistEditor.tsx`

**Interfaces:**
- Consumes: `exportSetlistListToPdf` (Task 3), `exportLayoutDocumentToPdf` (existing, `utils/setlistDocumentPdf.ts`), `buildInitialDocument` (existing, `utils/setlistDocument.ts`), `Setlist.mode` (Task 1).

- [ ] **Step 1: Import `exportSetlistListToPdf`**

Add to the imports at the top of `components/SetlistEditor.tsx`, alongside the existing `exportLayoutDocumentToPdf` import:

```ts
import { exportSetlistListToPdf } from '../utils/setlistListPdf';
```

- [ ] **Step 2: Branch `exportToPDF` on `currentSetlist.mode`**

Replace `exportToPDF` (`components/SetlistEditor.tsx:500-507`):

```ts
const exportToPDF = () => {
  if (!currentSetlist || setlistItems.length === 0) return;
  setShowPdfModal(false);

  const doc = currentSetlist.mode === 'document'
    ? exportLayoutDocumentToPdf(currentSetlist.layout_document ?? buildInitialDocument(setlistItems), setlistItems, pdfTitle)
    : exportSetlistListToPdf(setlistItems, pdfTitle);
  doc.save(`${pdfTitle}.pdf`);
};
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual verification**

Run: `npm run dev`. For a `list`-mode setlist with at least one song and one text note: click "Export PDF", confirm the downloaded PDF shows the song and note content (this is the export path that was previously silently dropping list-only edits). For a `document`-mode setlist: confirm PDF export still works exactly as before (unchanged code path).

- [ ] **Step 5: Commit**

```bash
git add components/SetlistEditor.tsx
git commit -m "fix: export PDF from the setlist's own mode instead of always from layout_document"
```

---

### Task 7: Duplication — copy `mode` and the matching content, remap `setlistSongId`

**Files:**
- Modify: `components/SetlistEditor.tsx`

**Interfaces:**
- Consumes: `Setlist.mode`, `Setlist.layout_document`, `Setlist.text_notes` (Task 1); `TiptapDoc`/`TiptapNode` from `types.ts`.

- [ ] **Step 1: Create the setlist row first, then duplicate songs, then patch in a remapped `layout_document`**

The new `setlist_songs` rows need a real `setlist_id` to insert against, which only exists after the new `setlists` row is created — so the setlist is inserted first (with `layout_document: null`), then its songs are duplicated and their new ids captured, then (for `document` mode) the copied `layout_document` is remapped to point at those new ids and patched in with a second update. Replace `executeDuplicateSetlist` (`components/SetlistEditor.tsx:288-331`):

```ts
const executeDuplicateSetlist = async () => {
  if (!setlistToDuplicate) return;
  const original = setlists.find(s => s.id === setlistToDuplicate);
  if (!original) {
    setShowDuplicateModal(false);
    setSetlistToDuplicate(null);
    return;
  }

  const { data: newSetlist, error } = await supabase
    .from('setlists')
    .insert([{
      title: `${original.title} (copie)`,
      user_id: user.id,
      group_id: original.group_id ?? null,
      mode: original.mode,
      text_notes: original.mode === 'list' ? (original.text_notes || []) : [],
      layout_document: null, // patched below once setlist_songs are duplicated, if mode === 'document'
    }])
    .select()
    .single();

  if (!error && newSetlist) {
    const { data: originalSongs } = await supabase
      .from('setlist_songs')
      .select('id, song_id, position, transpose')
      .eq('setlist_id', original.id)
      .order('position', { ascending: true });

    let idMap = new Map<string, string>();
    if (originalSongs && originalSongs.length > 0) {
      const { data: insertedSongs } = await supabase
        .from('setlist_songs')
        .insert(
          originalSongs.map(s => ({
            setlist_id: newSetlist.id,
            song_id: s.song_id,
            position: s.position,
            transpose: s.transpose,
          }))
        )
        .select('id, song_id, position, transpose')
        .order('position', { ascending: true });

      idMap = new Map(
        originalSongs.map((s, index) => [s.id, insertedSongs?.[index]?.id]).filter(([, v]) => v) as [string, string][]
      );
    }

    if (original.mode === 'document' && original.layout_document) {
      const remapped: TiptapDoc = {
        ...original.layout_document,
        content: original.layout_document.content.map((node) =>
          node.type === 'songBlock'
            ? { ...node, attrs: { ...node.attrs, setlistSongId: idMap.get(node.attrs?.setlistSongId as string) ?? node.attrs?.setlistSongId } }
            : node
        ),
      };
      await supabase.from('setlists').update({ layout_document: remapped }).eq('id', newSetlist.id);
      newSetlist.layout_document = remapped;
    }

    setSetlists([newSetlist, ...setlists]);
    handleSelectSetlist(newSetlist);
  }

  setShowDuplicateModal(false);
  setSetlistToDuplicate(null);
};
```

`TiptapDoc` is already imported in `components/SetlistEditor.tsx` (used by `handleLayoutDocumentChange`); no new import needed.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manual verification**

Run: `npm run dev`.
- Duplicate a `list`-mode setlist that has songs and text notes: confirm the copy is `list`-mode, has the same songs and notes, and exporting its PDF works.
- Duplicate a `document`-mode setlist that has a `layout_document` with at least one `songBlock`: confirm the copy is `document`-mode, opens showing the same document content, and that transposing or removing the song in the *copy's* document editor affects only the copy (proves `setlistSongId` was remapped to the copy's own `setlist_songs` rows, not the original's). Check in Supabase that the copy's `layout_document` `songBlock` node's `setlistSongId` matches one of the copy's own `setlist_songs.id` values, not the original's.

- [ ] **Step 4: Commit**

```bash
git add components/SetlistEditor.tsx
git commit -m "fix: duplicate a setlist's mode and matching content, remapping songBlock ids"
```

---

### Task 8: Full regression pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full automated test suite**

Run: `npm test`
Expected: all tests pass, including the new `utils/pdfRender.test.ts` and `utils/setlistListPdf.test.ts` cases from Tasks 2-3.

- [ ] **Step 2: Full type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: End-to-end manual walkthrough**

Run: `npm run dev`. Walk through, in order:
1. Create a setlist with "Liste" selected (default) — confirm no mode toggle appears once opened, list UI shown directly.
2. Add 2 songs and 1 text note to it, export PDF — confirm all 3 items appear in the PDF (this is the bug from the original report: previously, notes/songs added in list mode were silently missing from PDF once a `layout_document` existed).
3. Create a second setlist with "Document" selected — confirm the TipTap editor opens directly, add a song via "Insérer une chanson", export PDF — confirm unchanged behavior from before this change.
4. Duplicate both setlists — confirm each copy keeps its original's mode and content per Task 7's verification steps.
5. Open a setlist that existed before this migration ran (any setlist created before Task 1's migration was applied) — confirm it is `list`-mode and has no leftover `layout_document` content.

- [ ] **Step 4: Report results**

If any step in the walkthrough fails, stop and fix the responsible task before proceeding — do not mark this plan complete with a failing manual step.
