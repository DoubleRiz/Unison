# Unison — Claude Code Guide

## Présentation

**Unison** est une PWA pour musiciens permettant de :
- Retrouver des chansons et consulter leurs accords/paroles
- Transposer les accords à la volée et afficher les degrés harmoniques
- Créer et gérer des setlists pour les concerts/répétitions
- Organiser des groupes/bands et partager des chansons
- Accéder à des outils musicaux (dictionnaire d'accords, progressions d'accords)

## Stack technique

- **React 19** + **TypeScript** + **Vite 6**
- **Supabase** : authentification (email/password) + base de données PostgreSQL
- **Tailwind CSS** : thème clair/sombre (classes `dark:`)
- **jsPDF** : export PDF des setlists
- Dev server : `npm run dev` → port 3000

### Navigation
Pas de router — navigation par état `currentView` dans `App.tsx` (type union string).
Vues disponibles : `landing | main | editor | profile | setlists | groups | search | help | chord-dictionary | progressions | email-confirmed | reset-password`

### Structure des fichiers
```
App.tsx                    # Racine : gestion session, navigation, état global
types.ts                   # Types partagés : Song, Setlist, Group, GroupMember, Comment, NotationMode
hooks/useAppData.ts        # Fetch songs, groups, invites en fonction de la session
lib/supabaseClient.ts      # Client Supabase (URL + anon key hardcodés)
utils/musicLogic.ts        # Logique musicale : transpose, degrés, détection sections
constants/chordShapes.ts   # Voicings d'accords pour le dictionnaire
components/
  SongSheet.tsx            # Affichage d'une chanson avec accords
  SongEditor.tsx           # Éditeur de chanson
  AdvancedSearch.tsx       # Recherche avancée (filtres genres, tags)
  SetlistEditor.tsx        # Éditeur de setlists avec export PDF
  GroupManager.tsx         # Gestion des groupes/bands et invitations
  LandingPage.tsx          # Page d'accueil non-connectée
  tools/
    ChordDictionary.tsx    # Dictionnaire visuel d'accords
    ChordProgressions.tsx  # Outil progressions d'accords
```

### Responsive
- `isMobile` (< 768px) → `BottomNav` + sidebar masquée
- Desktop → `Sidebar` latérale persistante

### Format des chansons
Le contenu (`Song.content`) est du texte brut avec les accords entre crochets :
```
[Verse 1]
[Am]           [F]    [C]
Hello darkness my old friend
```
- Sections : `[Intro]`, `[Verse]`, `[Chorus]`, `[Bridge]`, etc.
- Accords : `[Am]`, `[C#m7]`, `[G/B]` (avec basse)
- La transposition et la conversion en degrés sont gérées dans `utils/musicLogic.ts`

### Base de données Supabase
Tables principales : `songs`, `favorites`, `setlists`, `setlist_songs`, `groups`, `group_members`, `users`
- Colonne DB `original_key` → propriété TS `key`

### Auth & accès
- Connecté : possibilité de créer des chansons, setlists, groupes

## Conventions de développement

- Composants en `React.FC` avec props typées via `interface`
- Tout le styling via Tailwind (pas de fichiers CSS séparés)
- Pas de state manager global — état centralisé dans `App.tsx`, passé par props drilling
- Appels Supabase directs dans les composants ou dans `useAppData` (pas de couche service)
