# 🎸 Unison

PWA pour musiciens : retrouver ses chansons, transposer les accords à la volée, créer des setlists pour les concerts, et organiser ses groupes autour d'un répertoire partagé.

## 🎯 Le problème

Un musicien qui joue en groupe jongle en général entre plusieurs PDF, applis d'accords et fichiers épars : pas de transposition rapide, pas de vue d'ensemble du répertoire du groupe, et aucune façon simple de préparer une setlist pour un concert.

## ▶️ Lancer le projet

```bash
npm install
npm run dev
```

Le serveur de dev tourne sur le port 3000. Nécessite un projet [Supabase](https://supabase.com) configuré.

## 🏗️ Architecture

Pas de router — la navigation passe par un état `currentView` centralisé dans `App.tsx` (union de strings) :

```
landing | main | editor | profile | setlists | groups | search
| help | chord-dictionary | progressions | email-confirmed | reset-password
```

### Structure des fichiers

```
App.tsx                    # Racine : gestion de session, navigation, état global
types.ts                   # Types partagés : Song, Setlist, Group, GroupMember, Comment, NotationMode
hooks/useAppData.ts        # Fetch songs, groups, invites en fonction de la session
lib/supabaseClient.ts      # Client Supabase
utils/musicLogic.ts        # Logique musicale : transpose, degrés, détection de sections
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

- Mobile (< 768px) → `BottomNav` + sidebar masquée
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
- La transposition et la conversion en degrés s'appuient sur `utils/musicLogic.ts`

## ✨ Fonctionnalités

- **Recherche et affichage des chansons** — paroles et accords, recherche avancée par genre et tags
- **Transposition à la volée** — changement de tonalité instantané, affichage en degrés harmoniques
- **Setlists exportables** — création de setlists pour concerts/répétitions, export PDF
- **Groupes et partage** — gestion de bands, invitations et partage de répertoire
- **Outils musicaux** — dictionnaire d'accords visuel, explorateur de progressions d'accords
- **Thème clair/sombre**

## 🛠️ Stack technique

React 19 · TypeScript · Vite 6 · Supabase (Auth + PostgreSQL) · Tailwind CSS · jsPDF

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1TDreMK6b3_j9IPg1Ls664ZHDDHk8Dodq

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
