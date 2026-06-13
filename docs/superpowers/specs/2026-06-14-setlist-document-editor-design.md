# Éditeur de document pour la mise en page des setlists (PDF)

## Contexte / Problème

Aujourd'hui, l'export PDF d'une setlist (`SetlistEditor.tsx`, fonction `exportToPDF`) se fait "à l'aveugle" :
- L'utilisateur clique sur "Export PDF", saisit un titre dans une petite modale, et télécharge directement le PDF sans aperçu.
- Le seul contenu libre possible est une "text note" (couleur + taille S/M/L), très limité en mise en forme.
- Aucune maîtrise de la mise en page globale (sauts de page, titres de section, page de garde, mots aux musiciens, etc.).

## Objectif

Ajouter une vue "Document" type éditeur de texte riche (Word-like) pour chaque setlist, dans laquelle :
- L'utilisateur peut écrire et formater librement du texte (gras, italique, souligné, titres, listes, alignement, couleur).
- Les chansons de la setlist apparaissent comme des **blocs verrouillés** (contenu non-éditable : titre, artiste, tonalité, accords/paroles gérés ailleurs), mais peuvent être déplacés/supprimés/transposés directement dans le document, en synchronisation avec la setlist.
- L'export PDF est généré à partir de ce document, donnant un contrôle complet sur la mise en page finale.

## Approches retenues

- **Éditeur de texte riche : TipTap (ProseMirror)**. Permet de définir un node atomique non-éditable (`SongBlock`) pour les chansons, gère nativement gras/italique/titres/listes/alignement/couleur, undo/redo, sérialisation JSON.
- **Génération PDF : parcours du JSON TipTap**. On parcourt l'arbre du document ; pour les nœuds `songBlock` on réutilise tel quel le moteur de rendu PDF existant (coloration des accords, sections, pagination) ; pour les nœuds texte (paragraphes, titres, listes) on mappe les marks/styles vers les appels `doc.text()` / `splitTextToSize()` de jsPDF. Cela évite de casser le rendu PDF des chansons qui fonctionne déjà bien.

## Modèle de données

Nouvelle colonne sur `setlists` (migration SQL, même pattern que `text_notes`) :

```sql
alter table public.setlists
  add column if not exists layout_document jsonb;
```

- `jsonb` nullable. Contient le document TipTap au format JSON (`{ type: 'doc', content: [...] }`).
- `null` signifie que le document n'a jamais été initialisé pour cette setlist.

## Initialisation du document

À la première ouverture de la vue "Document" pour une setlist (`layout_document === null`) :
1. On génère un document TipTap à partir de l'ordre actuel de `setlistItems` :
   - Chaque chanson → un node `songBlock` (attributs : `setlistSongId`, `songId`, `transpose`).
   - Un paragraphe vide est inséré entre/après les blocs chanson pour permettre la saisie.
   - Les `text_notes` existantes sont converties en paragraphes avec mise en forme correspondante (taille S → texte normal, M → H3, L → H1 ; couleur → mark de couleur reprenant la palette `TEXT_COLORS`).
2. Ce document généré est immédiatement persisté dans `layout_document`.

## Sauvegarde

Autosave avec debounce (~1.5s après la dernière modification), même pattern que `persistTextNotes` (update Supabase sur la colonne `layout_document`).

## Synchronisation bidirectionnelle avec `setlist_songs`

| Action dans le Document | Effet sur `setlist_songs` |
|---|---|
| Réordonner un `songBlock` (drag) | Recalcule les `position` de toutes les chansons (réutilise `updateAllPositions`) |
| Supprimer un `songBlock` | `removeItemFromSetlist` |
| Modifier la transposition (±) sur le bloc | `updateItemTranspose` |
| Insérer une nouvelle chanson (toolbar "Insérer une chanson") | Ouvre le sélecteur de bibliothèque, insère un `songBlock` au curseur + ajoute la ligne dans `setlist_songs` à la position correspondante |

À l'inverse, si une chanson est supprimée depuis la vue Liste alors que le Document existe déjà : au chargement suivant du Document, on compare les `songBlock` du document avec `setlist_songs` et on retire automatiquement les blocs orphelins.

## UI / Placement

Dans `SetlistEditor.tsx`, quand une setlist est ouverte, ajout d'un toggle à deux onglets dans le header de la colonne gauche :

- **"Liste"** — vue actuelle inchangée (gestion ordre / ajout / suppression / transposition / text notes simples pour le mode Perform).
- **"Document"** — nouvelle vue plein largeur (remplace temporairement le layout 2 colonnes).

### Vue "Document"

- **Toolbar sticky** : Gras / Italique / Souligné, 3 niveaux de titre (H1/H2/H3), listes à puces/numérotées, alignement (gauche/centre/droite), couleur de texte (palette `TEXT_COLORS`), bouton "Insérer une chanson".
- **Zone d'édition** : page(s) au format A4 stylisée (fond blanc, ombre, marges visibles) pour donner une sensation d'aperçu document. Le contenu s'écoule librement en édition ; la pagination réelle est calculée à l'export PDF.
- **Bloc chanson** : encart non-cliquable affichant titre / artiste / tonalité (+ transposition ±), bordure distincte + icône verrou, poignée de drag à gauche, bouton supprimer (avec possibilité d'annuler via toast, pas de modal bloquante).
- Bouton "Exporter PDF" accessible dans le header, dans les deux vues.

### Mobile

- Toolbar en barre horizontale scrollable en haut.
- Page en pleine largeur.
- Drag des blocs chanson désactivé ; remplacé par des boutons monter/descendre (comme la vue Liste actuelle) pour éviter les conflits avec le scroll tactile.

## Export PDF

- Le bouton "Exporter PDF" génère le PDF en parcourant `layout_document` :
  - `songBlock` → réutilise le rendu existant (titre 24pt, accords colorés, sections en gras, notes, pagination automatique).
  - Nœuds texte → mappés vers jsPDF :
    - Titres : H1=18pt, H2=14pt, H3=12pt, paragraphe normal=11pt.
    - Gras/italique → `doc.setFont(..., 'bold'|'italic')`.
    - Couleur → mark de couleur → `pdfRgb` de `TEXT_COLORS`.
    - Alignement → paramètre `align` de jsPDF (`left`/`center`/`right`).
    - Listes à puces/numérotées → préfixe texte (`•`, `1.`, `2.`...).
- Si `layout_document` est `null` (setlist jamais ouverte en vue Document) : le PDF est généré à partir d'un document initial construit à la volée (même logique que l'initialisation), sans persistance.

## Relation avec les fonctionnalités existantes

- Les `text_notes` (couleur/taille S/M/L) **restent inchangées** dans la vue Liste et le mode Perform (slides plein écran entre les chansons).
- Elles ne sont plus la source du PDF dès qu'un `layout_document` existe pour la setlist. Elles servent uniquement de point de départ lors de la génération initiale du document — ensuite les deux contenus évoluent indépendamment, sans tentative de synchronisation (complexité jugée disproportionnée).
- Le bouton "Ajouter une note" reste disponible dans la vue Liste, pour le mode Perform.

## Cas particuliers

- **Setlist vide** : vue Document accessible avec un placeholder ("Ajoutez des chansons depuis la vue Liste ou via le bouton Insérer").
- **Setlist virtuelle "Favoris"** : vue Document désactivée (comme le reste de l'édition aujourd'hui) ; seule la vue Liste est disponible.
- **Chanson supprimée depuis la vue Liste** : bloc orphelin retiré automatiquement du document au chargement suivant.

## Hors scope (v1)

- Synchronisation des `text_notes` avec le Document après la génération initiale.
- Pagination "live" dans l'éditeur (le document s'écoule librement ; seule l'exportation PDF pagine réellement).
- Édition du contenu des chansons (paroles/accords) depuis la vue Document — reste géré via `SongEditor`.
