# CLAUDE.md — Contexte de l'application Chord-Craft (Unison)

## Présentation du projet

**Chord-Craft** (nom interne du dépôt) est une application web musicale nommée **Unison** (`package.json`). C'est une application de gestion de partitions d'accords (chord sheets) destinée aux musiciens. Elle permet de créer, consulter, transposer et partager des partitions avec chords & lyrics.

L'application est construite avec **React 19 + TypeScript + Vite** et utilise **Supabase** comme backend (authentification + base de données PostgreSQL).

---

## Stack technique

| Technologie | Version | Rôle |
|---|---|---|
| React | ^19.2.0 | Framework UI |
| TypeScript | ~5.8.2 | Typage statique |
| Vite | ^6.2.0 | Bundler / Dev server |
| Supabase JS | 2.39.3 | Auth + BDD (PostgreSQL) |
| lucide-react | ^0.554.0 | Icônes |
| jsPDF | 2.5.1 | Export PDF |
| TailwindCSS | (via classes utilitaires) | Styling (dark/light mode) |

### Commandes principales
```bash
npm run dev      # Démarrer le serveur de développement
npm run build    # Build de production
npm run preview  # Prévisualiser le build
```

---

## Architecture du projet

```
chord-craft/
├── App.tsx                  # Composant racine : routing, state global, auth
├── index.tsx                # Point d'entrée React
├── index.html               # Template HTML
├── types.ts                 # Interfaces TypeScript globales
├── vite.config.ts           # Configuration Vite
├── package.json             # Dépendances (nom: "unison")
│
├── lib/
│   └── supabaseClient.ts    # Instance Supabase (URL + anon key)
│
├── hooks/
│   └── useAppData.ts        # Hook central de chargement des données
│
├── utils/
│   └── musicLogic.ts        # Logique musicale (transposition, degrés, parsing)
│
└── components/
    ├── Navbar.tsx            # Barre de navigation guest
    ├── Sidebar.tsx           # Panneau latéral (liste des songs, navigation)
    ├── Auth.tsx              # Modal d'authentification (login/signup)
    ├── LandingPage.tsx       # Page d'accueil / bibliothèque communautaire
    ├── SongSheet.tsx         # Affichage d'une partition (lecture)
    ├── SongEditor.tsx        # Éditeur de partition (création/modification)
    ├── SetlistEditor.tsx     # Gestionnaire de setlists
    ├── GroupManager.tsx      # Gestionnaire de groupes musicaux
    ├── Profile.tsx           # Page profil utilisateur / paramètres
    ├── AdvancedSearch.tsx    # Recherche avancée avec filtres
    ├── CommentsSection.tsx   # Section commentaires sur une chanson
    ├── Metronome.tsx         # Métronome intégré
    ├── HelpPage.tsx          # Page d'aide
    └── tools/
        ├── ChordDictionary.tsx    # Dictionnaire de positions d'accords
        └── ChordProgressions.tsx  # Explorateur de progressions d'accords
```

---

## Fichiers clés

### `App.tsx`
C'est le composant racine et le **cœur de l'application**. Il gère :
- **La session Supabase** (auth state)
- **Le routing par état** (`currentView`) — pas de react-router, navigation simulée par état React
- **Le thème** dark/light (persisté en `localStorage`)
- **La barre latérale** (responsive : fermée sur mobile par défaut)
- **La transposition** en temps réel (état `transpose`)
- **Le mode de notation** : Lettres (`Am`) vs Degrés (`6m`)
- **Les handlers globaux** : `handleSaveSong`, `handleDeleteSong`, `handleToggleFavorite`
- **La détection de doublons** avec modal de conflit

#### Views disponibles (état `currentView`) :
| Valeur | Composant rendu |
|---|---|
| `'landing'` | `LandingPage` |
| `'main'` | `SongSheet` (chanson sélectionnée) |
| `'editor'` | `SongEditor` |
| `'profile'` | `Profile` |
| `'setlists'` | `SetlistEditor` |
| `'groups'` | `GroupManager` |
| `'search'` | `AdvancedSearch` |
| `'help'` | `HelpPage` |
| `'chord-dictionary'` | `ChordDictionary` |
| `'progressions'` | `ChordProgressions` |

### `types.ts`
Toutes les **interfaces TypeScript** de l'application :
- `Song` — entité principale : titre, artiste, BPM, tonalité (`key`), contenu (chord sheet), notes, URL YouTube/audio, visibilité (`is_public`), favoris, groupe partagé, genres, tags, fork
- `Comment` — commentaires sur une chanson
- `Setlist` + `SetlistSong` — listes de concert
- `Group` + `GroupMember` — collaboration en groupe (rôles: `member` | `admin`, statuts: `pending` | `accepted`)
- `NotationMode` — enum `LETTERS` | `DEGREES`
- `Segment` + `Line` — structure du parser de chord sheet
- `GENRES` — tableau constant des genres disponibles

### `utils/musicLogic.ts`
Logique musicale pure (sans dépendances externes) :
- `CHROMATIC_SCALE` — gamme chromatique en dièses
- `NOTE_MAPPINGS` — normalisation bémols → dièses
- `transpose(chord, semitones)` — transpose un accord unique (supporte `/` basses, ex: `G/B`)
- `transposeContent(content, semitones)` — transpose tout le contenu d'une chanson (regex sur `[ACCORD]`, préserve les en-têtes de section)
- `convertToDegree(chord, key)` — convertit un accord en degré Nashville (ex: `Am` en Do → `6m`)
- `getSectionType(line)` — détecte les en-têtes de section (`[Chorus]`, `[Verse 1]`, etc.)

### `hooks/useAppData.ts`
Hook custom qui centralise tous les appels Supabase :
- Chargement des **songs** de l'utilisateur connecté (avec ses favoris)
- Chargement des **groupes** (acceptés + invitations en attente)
- Vérification du statut **admin** (`users.is_admin`)
- Chargement d'une **chanson publique** en mode guest
- Expose : `songs`, `setSongs`, `groups`, `setGroups`, `pendingInvitesCount`, `loading`, `publicSongData`, `isAdmin`, `fetchSongs`, `fetchGroups`

### `lib/supabaseClient.ts`
Instance Supabase. Contient l'URL du projet et la clé publique `anon`.

---

## Modèle de données Supabase (tables inférées)

| Table | Colonnes principales |
|---|---|
| `songs` | `id`, `user_id`, `title`, `artist`, `bpm`, `original_key`, `content`, `notes`, `youtube_url`, `audio_url`, `is_public`, `shared_with_group_id`, `genres`, `tags`, `forked_from`, `updated_at` |
| `favorites` | `user_id`, `song_id` |
| `setlists` | `id`, `user_id`, `group_id`, `title`, `created_at` |
| `setlist_songs` | `id`, `setlist_id`, `song_id`, `position` |
| `groups` | `id`, `name`, `created_by`, `created_at` |
| `group_members` | `id`, `group_id`, `user_id`, `status` (`pending`\|`accepted`), `role` (`member`\|`admin`) |
| `users` | `id`, `username`, `avatar_url`, `is_admin` |

> **Note** : Les colonnes Supabase utilisent `snake_case`, le frontend les mappe en `camelCase` (ex: `original_key` → `key`, `youtube_url` → `youtubeUrl`).

---

## Format du contenu d'une chanson (chord sheet)

Le contenu d'une chanson est stocké en **plain text** dans le champ `content`. Les accords sont encapsulés dans des crochets, intercalés avec les paroles :

```
[Chorus]
[Am]Let it [F]be, let it [C]be
[Am]Let it [F]be, let it [G]be

[Verse 1]
[C]When I [G]find myself in [Am]times of trouble
[F]Mother [C]Mary [G]comes to [C]me
```

**Règles de parsing :**
- `[SectionName]` — en-tête de section (Intro, Verse, Chorus, Bridge, Pont, Refrain, Pre-Chorus, Outro, Solo, Instrumental, Couplet, Strophe)
- `[Am]`, `[C/G]`, `[Cmaj7]` — accords (toujours dans des `[]`)
- Le texte hors `[]` représente les paroles

---

## Fonctionnalités principales

- ✅ **Authentification** (Supabase Auth) — inscription/connexion par email
- ✅ **CRUD de chansons** avec détection de doublons
- ✅ **Transposition** en temps réel (−/+ demi-tons)
- ✅ **Double notation** : Lettres (Am, G7) / Degrés Nashville (6m, 5)
- ✅ **Mode guest** : accès aux chansons publiques sans compte
- ✅ **Bibliothèque communautaire** (landing page, chansons publiques)
- ✅ **Fork** d'une chanson publique vers sa propre bibliothèque
- ✅ **Setlists** — organisation de chansons en listes de concert
- ✅ **Groupes** — partage de chansons avec un groupe, invitations
- ✅ **Favoris** — marquage de chansons
- ✅ **Recherche avancée** — filtres par genre, tonalité, tags, BPM...
- ✅ **Dictionnaire d'accords** — visualisation des positions sur le manche
- ✅ **Progressions d'accords** — explorateur de progressions
- ✅ **Métronome** intégré
- ✅ **Export PDF** (jsPDF)
- ✅ **Thème dark/light** (persisté en localStorage)
- ✅ **Responsive** (mobile-first, sidebar rétractable)
- ✅ **Commentaires** sur les chansons publiques
- ✅ **Admin** — rôle spécial via `users.is_admin`

---

## Conventions de code

- **Pas de react-router** : la navigation est gérée par l'état `currentView` dans `App.tsx`
- **Styling** : classes Tailwind CSS directement dans le JSX (dark mode via classe `dark` sur `<html>`)
- **Supabase RLS** : les politiques Row Level Security sont gérées côté Supabase (le code ne gère pas les permissions manuellement)
- **Mapping BDD ↔ Frontend** : toujours mapper explicitement dans `useAppData.ts` (pas d'utilisation directe des objets Supabase bruts)
- **Composants** : chaque composant est un fichier `.tsx` autonome dans `/components`
- **Icônes** : uniquement `lucide-react`
- **Genres supportés** : `['Rock', 'Blues', 'Country', 'Pop', 'Worship', 'Metal', 'Rap', "Rn'B", 'Soul', 'Jazz', 'Gospel']` (constante dans `types.ts`)
