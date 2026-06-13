# Setlist : confirmation de duplication + actions en vue détail

## Contexte

Une fonctionnalité de duplication de setlist a été ajoutée récemment (`handleDuplicateSetlist`, bouton Copy sur `SetlistCard`). Deux ajustements UX sont demandés :

1. La duplication s'exécute actuellement sans confirmation au clic — il faut une popup de confirmation.
2. En vue détail d'une setlist (quand on est "dedans"), il n'y a aucun moyen de la copier ou de la supprimer — ces actions ne sont accessibles que depuis la liste.

## Design

### 1. Confirmation de duplication

- Nouveaux states : `setlistToDuplicate: string | null` et `showDuplicateModal: boolean`, sur le modèle de `setlistToDelete` / `showDeleteModal`.
- `confirmDuplicateSetlist(id, e)` : `e.stopPropagation()`, ignore si `id === FAVORITES_ID`, stocke l'id et ouvre la modale.
- La logique actuelle de `handleDuplicateSetlist` est renommée `executeDuplicateSetlist` et appelée uniquement par le bouton "Dupliquer" de la modale. Elle ferme la modale et réinitialise `setlistToDuplicate` à la fin.
- Modale de confirmation : même style visuel que la modale de suppression (overlay centré, icône, titre "Dupliquer cette setlist ?", description courte, boutons Annuler / Dupliquer).
- Le bouton Copy de `SetlistCard` appelle désormais `confirmDuplicateSetlist` (au lieu de dupliquer directement).

### 2. Menu d'actions en vue détail

- Ajout d'un bouton icône `MoreVertical` (lucide-react) dans la barre d'actions du header de la vue détail.
- Au clic, affichage d'un menu déroulant avec deux entrées : "Dupliquer" (icône `Copy`) et "Supprimer" (icône `Trash2`).
- Le menu se ferme au clic en dehors (overlay invisible ou gestion `onBlur`).
- Masqué quand `isVirtual` est vrai (setlist "Favoris"), de la même façon que les autres actions d'édition sont déjà masquées pour cette setlist.
- "Dupliquer" → appelle `confirmDuplicateSetlist(currentSetlist.id, e)` et ferme le menu.
- "Supprimer" → appelle `confirmDeleteSetlist(currentSetlist.id, e)` et ferme le menu.

### 3. Modales partagées entre les deux vues

- `showDeleteModal` et la nouvelle `showDuplicateModal` doivent pouvoir s'afficher aussi bien depuis la vue liste (`!currentSetlist`) que depuis la vue détail.
- Les deux blocs de modale sont rendus dans les deux branches de rendu (liste et détail), en réutilisant les mêmes states/handlers.
- `executeDeleteSetlist` gère déjà le cas où on supprime la setlist actuellement affichée (`setCurrentSetlist(null)`) — rien à changer côté logique.
- `executeDuplicateSetlist`, après création, appelle `handleSelectSetlist(newSetlist)` comme actuellement — donc si on duplique depuis la vue détail, on bascule sur la nouvelle setlist dupliquée.

### 4. Cartes de la liste (`SetlistCard`)

- Aucun changement visuel : les icônes Copy/Trash restent visibles directement sur chaque carte.
- Seul le handler du bouton Copy change (ouvre la modale de confirmation au lieu de dupliquer directement).

## Hors scope

- Pas de changement sur la suppression depuis la liste (déjà confirmée via modale existante).
- Pas de menu "..." sur les cartes de la liste (gardé tel quel pour cohérence avec le choix utilisateur).
