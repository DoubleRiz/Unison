# Setlist Duplicate Confirmation + Detail View Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a confirmation popup before duplicating a setlist, and expose Duplicate/Delete actions from inside the setlist detail view via a "..." menu.

**Architecture:** All changes are in `components/SetlistEditor.tsx`. We mirror the existing delete-confirmation pattern (`setlistToDelete` / `showDeleteModal` / `confirmDeleteSetlist` / `executeDeleteSetlist`) for duplication, and add a small dropdown menu (click-outside-to-close, same pattern as `Navbar.tsx`'s search suggestions) to the detail view header.

**Tech Stack:** React 19 + TypeScript, Tailwind CSS, lucide-react icons. No test framework is configured in this project — verification is manual via `npm run dev` in the browser.

---

### Task 1: Add duplicate-confirmation state and split the duplicate handler into confirm/execute

**Files:**
- Modify: `components/SetlistEditor.tsx:183-184` (state declarations)
- Modify: `components/SetlistEditor.tsx:309-344` (handler)

- [ ] **Step 1: Add the new state variables next to the existing delete-confirmation state**

In `components/SetlistEditor.tsx`, find:

```tsx
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [setlistToDelete, setSetlistToDelete] = useState<string | null>(null);
```

Replace with:

```tsx
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [setlistToDelete, setSetlistToDelete] = useState<string | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [setlistToDuplicate, setSetlistToDuplicate] = useState<string | null>(null);
```

- [ ] **Step 2: Split `handleDuplicateSetlist` into `confirmDuplicateSetlist` (opens the modal) and `executeDuplicateSetlist` (performs the copy)**

Find the existing handler:

```tsx
  const handleDuplicateSetlist = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const original = setlists.find(s => s.id === id);
    if (!original) return;

    const { data: newSetlist, error } = await supabase
      .from('setlists')
      .insert([{
        title: `${original.title} (copie)`,
        user_id: user.id,
        group_id: original.group_id ?? null,
        text_notes: original.text_notes || [],
      }])
      .select()
      .single();
    if (error || !newSetlist) return;

    const { data: songs } = await supabase
      .from('setlist_songs')
      .select('song_id, position, transpose')
      .eq('setlist_id', id);

    if (songs && songs.length > 0) {
      await supabase.from('setlist_songs').insert(
        songs.map(s => ({
          setlist_id: newSetlist.id,
          song_id: s.song_id,
          position: s.position,
          transpose: s.transpose,
        }))
      );
    }

    setSetlists([newSetlist, ...setlists]);
    handleSelectSetlist(newSetlist);
  };
```

Replace it with:

```tsx
  const confirmDuplicateSetlist = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (id === FAVORITES_ID) return;
    setSetlistToDuplicate(id);
    setShowDuplicateModal(true);
  };

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
        text_notes: original.text_notes || [],
      }])
      .select()
      .single();

    if (!error && newSetlist) {
      const { data: songs } = await supabase
        .from('setlist_songs')
        .select('song_id, position, transpose')
        .eq('setlist_id', original.id);

      if (songs && songs.length > 0) {
        await supabase.from('setlist_songs').insert(
          songs.map(s => ({
            setlist_id: newSetlist.id,
            song_id: s.song_id,
            position: s.position,
            transpose: s.transpose,
          }))
        );
      }

      setSetlists([newSetlist, ...setlists]);
      handleSelectSetlist(newSetlist);
    }

    setShowDuplicateModal(false);
    setSetlistToDuplicate(null);
  };
```

- [ ] **Step 3: Update the `SetlistCard` usages to call `confirmDuplicateSetlist` instead of `handleDuplicateSetlist`**

There are two usages around `components/SetlistEditor.tsx:819` and `:828`:

```tsx
              <SetlistCard key={list.id} list={list} onDelete={confirmDeleteSetlist} onDuplicate={handleDuplicateSetlist} onSelect={handleSelectSetlist} />
```

and

```tsx
              {g.lists.map(list => <SetlistCard key={list.id} list={list} onDelete={confirmDeleteSetlist} onDuplicate={handleDuplicateSetlist} onSelect={handleSelectSetlist} />)}
```

In both, replace `onDuplicate={handleDuplicateSetlist}` with `onDuplicate={confirmDuplicateSetlist}`.

- [ ] **Step 4: Verify no other references to `handleDuplicateSetlist` remain**

Run:

```bash
grep -n "handleDuplicateSetlist" components/SetlistEditor.tsx
```

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add components/SetlistEditor.tsx
git commit -m "refactor: split setlist duplication into confirm/execute steps"
```

---

### Task 2: Add the duplicate-confirmation modal and render both modals in the list view

**Files:**
- Modify: `components/SetlistEditor.tsx` (list view render block, currently starting around line 741)

- [ ] **Step 1: Add the duplicate-confirmation modal next to the existing delete modal in the list view**

Find the existing delete modal block (inside `if (!currentSetlist) { ... return ( ... ) }`):

```tsx
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Delete Setlist?</h3>
              <p className="text-slate-400 text-sm">Are you sure? This action cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors">Cancel</button>
              <button onClick={executeDeleteSetlist}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
```

Immediately after this block (still inside the same enclosing `<div>`), add:

```tsx

      {showDuplicateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 bg-cyan-900/20 text-cyan-400 rounded-full flex items-center justify-center mb-4">
                <Copy size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Duplicate Setlist?</h3>
              <p className="text-slate-400 text-sm">A copy of this setlist will be created with all its songs.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDuplicateModal(false)}
                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors">Cancel</button>
              <button onClick={executeDuplicateSetlist}
                className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium transition-colors">Duplicate</button>
            </div>
          </div>
        </div>
      )}
```

- [ ] **Step 2: Manual verification**

Run `npm run dev`, open the Setlists view, click the Copy icon on any setlist card. Expected: a confirmation modal appears with "Duplicate Setlist?" and Cancel/Duplicate buttons. Clicking Cancel closes it without creating a copy. Clicking Duplicate creates a copy (title ending in "(copie)") and navigates into it.

- [ ] **Step 3: Commit**

```bash
git add components/SetlistEditor.tsx
git commit -m "feat: confirm before duplicating a setlist from the list view"
```

---

### Task 3: Add a "..." actions menu (Duplicate/Delete) to the setlist detail view, and render both modals there too

**Files:**
- Modify: `components/SetlistEditor.tsx:5-29` (icon imports)
- Modify: `components/SetlistEditor.tsx` (detail view state + render block)

- [ ] **Step 1: Import the `MoreVertical` icon**

Find the lucide-react import block:

```tsx
import {
  Plus,
  Trash2,
  FileDown,
  GripVertical,
  Search,
  ChevronLeft,
  Calendar,
  Play,
  Minus,
  Edit2,
  X,
  ChevronRight,
  Users,
  User,
  AlertTriangle,
  Hash,
  Type,
  AlignLeft,
  Check,
  Heart,
  ChevronUp,
  ChevronDown,
  Copy
} from 'lucide-react';
```

Add `MoreVertical` after `Copy`:

```tsx
import {
  Plus,
  Trash2,
  FileDown,
  GripVertical,
  Search,
  ChevronLeft,
  Calendar,
  Play,
  Minus,
  Edit2,
  X,
  ChevronRight,
  Users,
  User,
  AlertTriangle,
  Hash,
  Type,
  AlignLeft,
  Check,
  Heart,
  ChevronUp,
  ChevronDown,
  Copy,
  MoreVertical
} from 'lucide-react';
```

- [ ] **Step 2: Make `confirmDeleteSetlist`'s event parameter optional**

The detail view menu will call this handler without a mouse event. Find:

```tsx
  const confirmDeleteSetlist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (id === FAVORITES_ID) return;
    setSetlistToDelete(id);
    setShowDeleteModal(true);
  };
```

Replace with:

```tsx
  const confirmDeleteSetlist = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (id === FAVORITES_ID) return;
    setSetlistToDelete(id);
    setShowDeleteModal(true);
  };
```

- [ ] **Step 3: Add menu-open state and a click-outside-to-close effect**

Find the state declarations from Task 1 (now reading):

```tsx
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [setlistToDelete, setSetlistToDelete] = useState<string | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [setlistToDuplicate, setSetlistToDuplicate] = useState<string | null>(null);
```

Add a new line after it:

```tsx
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [setlistToDelete, setSetlistToDelete] = useState<string | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [setlistToDuplicate, setSetlistToDuplicate] = useState<string | null>(null);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
```

Now find the existing `libraryRef` declaration:

```tsx
  const libraryRef = useRef<HTMLDivElement>(null);
```

Add a new ref right after it:

```tsx
  const libraryRef = useRef<HTMLDivElement>(null);
  const actionsMenuRef = useRef<HTMLDivElement>(null);
```

Next, find the `handleSelectSetlist` function:

```tsx
  const handleSelectSetlist = (setlist: Setlist) => {
    setCurrentSetlist(setlist);
    fetchSetlistItems(setlist.id);
    setPerformanceMode(false);
  };
```

Add a `useEffect` right after it that closes the actions menu on outside click:

```tsx
  const handleSelectSetlist = (setlist: Setlist) => {
    setCurrentSetlist(setlist);
    fetchSetlistItems(setlist.id);
    setPerformanceMode(false);
  };

  useEffect(() => {
    if (!showActionsMenu) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setShowActionsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showActionsMenu]);
```

- [ ] **Step 4: Render the delete and duplicate confirmation modals inside the detail view too**

Find the start of the detail view render, right after `isVirtual` is computed:

```tsx
const isVirtual = currentSetlist?.id === FAVORITES_ID;

  return (
    <div className="max-w-6xl mx-auto min-h-[calc(100vh-140px)] flex flex-col relative px-4 sm:px-0">
      {editingTextId !== null && (
```

Insert the two modal blocks between the opening `<div>` and the `editingTextId` block:

```tsx
const isVirtual = currentSetlist?.id === FAVORITES_ID;

  return (
    <div className="max-w-6xl mx-auto min-h-[calc(100vh-140px)] flex flex-col relative px-4 sm:px-0">
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Delete Setlist?</h3>
              <p className="text-slate-400 text-sm">Are you sure? This action cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors">Cancel</button>
              <button onClick={executeDeleteSetlist}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {showDuplicateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 bg-cyan-900/20 text-cyan-400 rounded-full flex items-center justify-center mb-4">
                <Copy size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Duplicate Setlist?</h3>
              <p className="text-slate-400 text-sm">A copy of this setlist will be created with all its songs.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDuplicateModal(false)}
                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors">Cancel</button>
              <button onClick={executeDuplicateSetlist}
                className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium transition-colors">Duplicate</button>
            </div>
          </div>
        </div>
      )}

      {editingTextId !== null && (
```

- [ ] **Step 5: Add the "..." actions menu button to the detail view header**

Find the action button group in the header:

```tsx
      <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
        <button
          onClick={() => setNotationMode(m => m === NotationMode.LETTERS ? NotationMode.DEGREES : NotationMode.LETTERS)}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm font-medium text-slate-300 hover:text-white transition-colors"
        >
          {notationMode === NotationMode.LETTERS ? <Hash size={18} /> : <Type size={18} />}
          <span>{notationMode === NotationMode.LETTERS ? 'Letters' : 'Degrees'}</span>
        </button>

        <button
          onClick={startPerformance}
          disabled={setlistItems.length === 0}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
        >
          <Play size={18} />
          Perform
        </button>
        <button onClick={() => setShowPdfModal(true)} disabled={setlistItems.length === 0}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg font-medium transition-colors disabled:opacity-50 text-sm sm:text-base">
          <FileDown size={18} /> <span className="hidden sm:inline">Export PDF</span><span className="sm:hidden">PDF</span>
        </button>
      </div>
```

Replace it with (adds the "..." menu after the Export PDF button, hidden for the virtual Favorites setlist):

```tsx
      <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
        <button
          onClick={() => setNotationMode(m => m === NotationMode.LETTERS ? NotationMode.DEGREES : NotationMode.LETTERS)}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm font-medium text-slate-300 hover:text-white transition-colors"
        >
          {notationMode === NotationMode.LETTERS ? <Hash size={18} /> : <Type size={18} />}
          <span>{notationMode === NotationMode.LETTERS ? 'Letters' : 'Degrees'}</span>
        </button>

        <button
          onClick={startPerformance}
          disabled={setlistItems.length === 0}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
        >
          <Play size={18} />
          Perform
        </button>
        <button onClick={() => setShowPdfModal(true)} disabled={setlistItems.length === 0}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg font-medium transition-colors disabled:opacity-50 text-sm sm:text-base">
          <FileDown size={18} /> <span className="hidden sm:inline">Export PDF</span><span className="sm:hidden">PDF</span>
        </button>

        {!isVirtual && (
          <div className="relative" ref={actionsMenuRef}>
            <button
              onClick={() => setShowActionsMenu(v => !v)}
              className="flex items-center justify-center p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
            >
              <MoreVertical size={18} />
            </button>
            {showActionsMenu && (
              <div className="absolute right-0 mt-2 w-44 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl z-40 overflow-hidden">
                <button
                  onClick={() => { setShowActionsMenu(false); confirmDuplicateSetlist(currentSetlist.id); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-cyan-400 transition-colors text-left"
                >
                  <Copy size={16} /> Duplicate
                </button>
                <button
                  onClick={() => { setShowActionsMenu(false); confirmDeleteSetlist(currentSetlist.id); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-red-400 transition-colors text-left"
                >
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>
```

- [ ] **Step 6: Manual verification**

Run `npm run dev`. Open a (non-favorites) setlist in detail view. Confirm:
- A "..." (vertical dots) button appears at the end of the action bar.
- Clicking it opens a menu with "Duplicate" and "Delete".
- Clicking outside the menu closes it.
- "Duplicate" opens the duplicate confirmation modal; confirming creates a copy and navigates to it.
- "Delete" opens the existing delete confirmation modal; confirming deletes the setlist and returns to the setlist list.
- Open the virtual "Favorites" setlist and confirm the "..." button does not appear.

- [ ] **Step 7: Commit**

```bash
git add components/SetlistEditor.tsx
git commit -m "feat: add duplicate/delete actions menu to setlist detail view"
```

---

## Self-Review Notes

- Spec coverage: confirmation modal for duplicate (Task 2/3), detail-view copy/delete via kebab menu (Task 3), shared modals across both views (Task 3 Step 3 + Task 2 Step 1), SetlistCard appearance unchanged (Task 1 Step 3 only changes the handler, not the markup).
- `currentSetlist.id` is safe to use directly in Task 3 Step 4 since this code is inside the `if (!currentSetlist) { ... return ... }` early-return branch, so `currentSetlist` is non-null (TypeScript already narrows this earlier in the same render block, e.g. `currentSetlist.title` is used unguarded a few lines below).
