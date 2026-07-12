# Setlist mode lock (liste vs document) — design

## Contexte / problème

Une setlist propose deux vues de contenu libre : "liste" (`text_notes`, notes texte interleaved avec les chansons) et "document" (`layout_document`, éditeur riche TipTap). Aujourd'hui, `setlistView` est un simple état d'UI local (`SetlistEditor.tsx:161`), non persisté, et les deux vues opèrent sur la **même** setlist en parallèle. `layout_document` est initialisé une seule fois depuis `text_notes` à la première ouverture du mode document (`buildInitialDocument`), puis les deux contenus évoluent **indépendamment** — c'est documenté comme hors scope dans `docs/superpowers/specs/2026-06-14-setlist-document-editor-design.md`.

Conséquence : une chanson ajoutée en mode liste après création du `layout_document` n'apparaît jamais dans le document ni dans l'export PDF (qui lit exclusivement `layout_document`, cf. `utils/setlistDocumentPdf.ts` et `SetlistEditor.tsx` `exportToPDF`). L'utilisateur perçoit un manque d'isomorphisme entre les deux vues et un export qui ne reflète pas ses modifications en mode liste.

## Décision

Le mode (liste ou document) devient un attribut **figé à la création** de la setlist. Une setlist n'a plus jamais qu'une seule représentation de contenu libre active pendant toute sa vie — la divergence devient structurellement impossible.

## 1. Schéma & types

Nouvelle migration `supabase/migrations/<timestamp>_add_mode_to_setlists.sql` :

```sql
alter table public.setlists
  add column mode text not null default 'list' check (mode in ('list', 'document'));

update public.setlists set layout_document = null;
```

- La colonne est ajoutée avec `DEFAULT 'list'`, donc toutes les lignes existantes sont automatiquement backfillées à `'list'` par l'`ALTER TABLE`.
- Le `layout_document` de toute setlist existante est effacé (perte assumée du contenu document déjà produit, comme décidé) — cohérent avec le fait que ces setlists deviennent définitivement `mode = 'list'`.

`types.ts` — `Setlist` interface (actuellement lignes 41-50) :

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
  songs?: Song[];
}
```

## 2. Création d'une setlist

Le formulaire inline "Create New Setlist" (`SetlistEditor.tsx:672-679`) reçoit un sélecteur segmenté "Liste" / "Document" (nouvel état local, ex. `newSetlistMode`, initialisé à `'list'`).

`handleCreateSetlist` (`SetlistEditor.tsx:252-264`) inclut `mode: newSetlistMode` dans le payload d'insertion Supabase.

La setlist virtuelle "Favoris" (`isVirtual`) n'est pas concernée — elle reste toujours en mode liste, sans passer par ce formulaire.

## 3. Verrouillage du mode / suppression de la bascule

Les boutons "Liste" / "Document" (`SetlistEditor.tsx:910-925`, rendus `!isVirtual`) sont supprimés. Le rendu de la vue (branche `list` vs `<SetlistDocumentEditor>`, lignes ~978 et ~1157-1168) se base uniquement sur `currentSetlist.mode` — plus d'état `setlistView` local mutable par l'utilisateur.

- Setlist `mode: 'document'` : comportement actuel inchangé (édition TipTap, ajout de chansons via `songBlock`, autosave).
- Setlist `mode: 'list'` : ne possède jamais de `layout_document` ; toute la gestion (chansons + notes texte interleaved, `persistTextNotes`) reste inchangée.

`buildInitialDocument` (conversion `text_notes` → doc TipTap initial) devient morte : une setlist en mode document n'a jamais eu de `text_notes` significatifs puisque le mode est fixé dès la création, avant tout ajout de contenu. Elle est supprimée, ainsi que son appel dans `SetlistDocumentEditor.tsx` (remplacé par un document TipTap vide par défaut, ex. `{ type: 'doc', content: [] }`).

## 4. Export PDF selon le mode

Nouveau fichier `utils/setlistListPdf.ts`, exportant `exportSetlistListToPdf(setlistItems: SetlistItem[], pdfTitle: string): jsPDF`. Il réutilise directement les briques bas-niveau de `utils/pdfRender.ts` (`PdfContext`, `startNewPage`, `sanitizePdfText`, `renderSongToPdf`) et ajoute un petit renderer `renderTextNoteToPdf(ctx, note: SetlistTextNote)` (texte simple avec couleur/taille, pas de nœuds TipTap à interpréter). Il parcourt `setlistItems` — déjà la séquence unique et ordonnée chansons+notes utilisée par le rendu de la vue liste — dans l'ordre, sans conversion intermédiaire.

`exportToPDF` (`SetlistEditor.tsx`, ~ligne 500-507) devient :

```ts
const doc = currentSetlist.mode === 'document'
  ? exportLayoutDocumentToPdf(currentSetlist.layout_document ?? { type: 'doc', content: [] }, setlistItems, pdfTitle)
  : exportSetlistListToPdf(setlistItems, pdfTitle);
doc.save(`${pdfTitle}.pdf`);
```

(Le mode document n'a plus besoin de `buildInitialDocument` en fallback puisque `layout_document` existe toujours dès la création si `mode === 'document'`, initialisé vide.)

## Hors scope

- Pas de conversion/migration d'une setlist `document` existante vers `list` (ou inversement) après cette migration one-shot : le choix est définitif, aucune UI de conversion n'est prévue.
- Pas de récupération du contenu `layout_document` effacé lors de la migration.
