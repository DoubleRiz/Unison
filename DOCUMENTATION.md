# Documentation Unison

**Unison** est une application web progressive (PWA) conçue pour les musiciens. Elle permet de retrouver et consulter des fiches d'accords, transposer des chansons, créer des setlists pour les concerts, collaborer en groupe et accéder à des outils musicaux.

---

## Sommaire

1. [Démarrage — Créer un compte](#1-démarrage--créer-un-compte)
2. [Naviguer dans l'application](#2-naviguer-dans-lapplication)
3. [Bibliothèque de chansons](#3-bibliothèque-de-chansons)
4. [Afficher une chanson](#4-afficher-une-chanson)
5. [Créer et modifier une chanson](#5-créer-et-modifier-une-chanson)
6. [Transposition et notation](#6-transposition-et-notation)
7. [Setlists](#7-setlists)
8. [Mode performance (Stage Mode)](#8-mode-performance-stage-mode)
9. [Groupes et collaboration](#9-groupes-et-collaboration)
10. [Outils musicaux](#10-outils-musicaux)
    - [Dictionnaire d'accords](#101-dictionnaire-daccords)
    - [Progressions d'accords](#102-progressions-daccords)
11. [Favoris](#11-favoris)
12. [Export PDF](#12-export-pdf)
13. [Installer l'application (PWA)](#13-installer-lapplication-pwa)
14. [Thème clair / sombre](#14-thème-clair--sombre)
15. [Format des fiches d'accords](#15-format-des-fiches-daccords)

---

## 1. Démarrage — Créer un compte

Un compte est nécessaire pour créer des chansons, gérer des setlists, rejoindre des groupes et enregistrer des favoris. Les visiteurs non connectés peuvent consulter les chansons publiques.

**Comment créer un compte :**
1. Clique sur **Se connecter** dans la barre latérale ou la navigation.
2. Renseigne ton adresse e-mail et un mot de passe.
3. Confirme ton adresse e-mail via le lien reçu par mail.
4. Une fois connecté, ton profil apparaît dans la barre de navigation.

**Réinitialiser son mot de passe :**
- Utilise le lien "Mot de passe oublié" sur l'écran de connexion. Un e-mail de réinitialisation sera envoyé.

---

## 2. Naviguer dans l'application

L'application utilise un système de vues sans rechargement de page.

**Sur ordinateur :**
- La barre latérale gauche affiche la liste des chansons et les liens vers les différentes sections.
- La barre de navigation en haut donne accès au profil, à la recherche, au bouton chanson aléatoire et au thème.

**Sur mobile :**
- La navigation se fait via la barre en bas de l'écran avec les onglets principaux.
- La barre latérale est masquée pour laisser plus de place au contenu.

**Vues disponibles :**
- **Accueil** — Page de présentation avec les dernières chansons ajoutées
- **Bibliothèque** — Recherche et exploration des chansons
- **Éditeur** — Créer ou modifier une chanson
- **Setlists** — Gérer ses setlists de concert
- **Groupes** — Gérer ses groupes musicaux
- **Dictionnaire d'accords** — Consulter les diagrammes d'accords
- **Progressions** — Explorer des progressions d'accords
- **Profil** — Gérer son compte

---

## 3. Bibliothèque de chansons

La bibliothèque regroupe toutes les chansons accessibles selon ton niveau d'accès.

**Rechercher une chanson :**
1. Accède à la vue **Bibliothèque** via la navigation.
2. Utilise la barre de recherche pour filtrer par **titre**.
3. Affine avec les filtres disponibles :
   - **Artiste** — Sélectionne un artiste dans la liste déroulante
   - **Genre** — Filtre par genre musical
   - **Tag** — Filtre par tag personnalisé
4. Clique sur **Effacer les filtres** pour réinitialiser.

**Parcourir les résultats :**
- Les résultats affichent le titre, l'artiste, la tonalité et les genres/tags.
- Jusqu'à 50 résultats par page avec une pagination numérotée.
- Clique sur une chanson pour l'afficher.

**Chanson aléatoire :**
- Le bouton **Surprise me** sélectionne une chanson au hasard parmi les résultats filtrés.
- Le bouton dé dans la barre de navigation fait la même chose sans filtre.

**Ajouter une chanson :**
- Le bouton **Ajouter une chanson** (visible si connecté) ouvre l'éditeur pour créer une nouvelle fiche.

---

## 4. Afficher une chanson

Cliquer sur une chanson ouvre la fiche d'accords complète.

**Informations affichées :**
- Titre, artiste, tonalité d'origine, BPM
- Contenu : sections (Intro, Couplet, Refrain, Pont…) avec les accords alignés au-dessus des paroles

**Contrôles de lecture et d'affichage :**
- **Zoom** — Augmente ou réduit la taille du texte (touches + et −, ou pinch sur mobile)
- **Masquer les accords** — Affiche uniquement les paroles sans les accords
- **Mode notation** — Bascule entre la notation alphabétique (Do, Ré, Mi… ou C, D, E…) et les degrés harmoniques (1, 2m, 5…)
- **Transposition** — Transpose la chanson en temps réel (voir section 6)

**Défilement automatique :**
1. Appuie sur le bouton **Play** (lecture automatique).
2. Ajuste la vitesse avec le curseur (niveaux 1 à 7).
3. Appuie sur **Pause** pour stopper. Le défilement s'arrête automatiquement en fin de chanson.

**Actions sur la chanson :**
- **Favori** — Icône cœur pour ajouter aux favoris (connexion requise)
- **Modifier** — Ouvre l'éditeur (visible pour le créateur ou les membres du groupe)
- **Supprimer** — Supprime définitivement la chanson (confirmation demandée)
- **Exporter en PDF** — Télécharge la fiche formatée

**Commentaires :**
- Une section commentaires en bas de la fiche permet d'échanger avec d'autres utilisateurs.

---

## 5. Créer et modifier une chanson

**Accéder à l'éditeur :**
- Clique sur **Ajouter une chanson** depuis la bibliothèque
- Ou clique sur le bouton **Modifier** sur une fiche existante

**Informations de base :**
- **Titre** (obligatoire)
- **Artiste** (obligatoire)
- **Tonalité** — Sélectionne la note (Do à Si) et la qualité (majeur / mineur)
- **BPM** — Tempo de la chanson (facultatif)

**Contenu de la fiche :**
- Zone de texte monospace pour saisir les accords et paroles.
- Les accords s'écrivent entre crochets : `[Am]`, `[C]`, `[G7]`
- Les sections s'écrivent aussi entre crochets sur une ligne seule : `[Couplet]`, `[Refrain]`
- Un modèle de départ est fourni pour les nouvelles chansons.

**Métadonnées supplémentaires :**
- **URL YouTube** — Lien vers la vidéo de référence
- **URL Audio** — Lien vers un fichier MP3/WAV
- **Notes** — Informations de performance, paroles supplémentaires, remarques

**Organisation :**
- **Genres** — Sélectionne un ou plusieurs genres parmi la liste prédéfinie
- **Tags** — Ajoute des mots-clés personnalisés (tape le tag et appuie sur Entrée). Les tags existants sont suggérés automatiquement.

**Visibilité et partage :**
- **Public** — La chanson est visible par tous les utilisateurs
- **Privé** — Visible uniquement par toi
- **Partager avec un groupe** — Rend la chanson éditable par les membres d'un groupe (si tu fais partie d'un groupe)

**Enregistrer :**
- Clique sur **Enregistrer** pour sauvegarder et revenir à la fiche.
- Clique sur **Annuler** pour abandonner les modifications.

---

## 6. Transposition et notation

### Transposition

La transposition permet d'adapter une chanson à la tessiture d'un chanteur ou à un instrument accordé différemment, sans modifier la fiche d'origine.

**Transposition globale :**
- Utilise les boutons **+ / −** dans la barre de navigation pour transposer toutes les chansons affichées.
- Le décalage actuel est affiché dans un badge (ex. : `+2`).
- Cette valeur s'applique à toutes les chansons jusqu'à ce qu'elle soit réinitialisée.

**Transposition par chanson dans une setlist :**
- Dans l'éditeur de setlist, chaque chanson dispose de ses propres boutons **+ / −**.
- Ce décalage est indépendant de la transposition globale.

**Comment fonctionne la transposition :**
- Les accords entre crochets sont transposes en temps réel.
- La tonalité affichée dans l'en-tête est mise à jour automatiquement.
- Les accords complexes (Am7, C#m7, G/B…) et les accords à basse séparée sont gérés correctement.

### Notation par degrés

Le mode **Degrés** affiche les accords sous forme de chiffres relatifs à la tonalité de la chanson (système Nashville Number System).

- `1` = accord sur la tonique
- `5` = accord sur la dominante
- `6m` = accord mineur sur le 6e degré
- `b7` = accord sur le 7e degré abaissé

**Comment activer :**
- Clique sur le bouton **Degrés / Notes** dans la fiche ou la barre de navigation.
- La préférence est conservée pendant la session.

---

## 7. Setlists

Les setlists permettent de préparer et organiser les chansons pour un concert ou une répétition.

### Créer une setlist

1. Accède à la vue **Setlists**.
2. Saisis un nom dans le champ de création.
3. Sélectionne optionnellement un groupe si la setlist est pour un groupe.
4. Clique sur **Créer**.

### Gérer les chansons d'une setlist

**Ajouter une chanson :**
1. Ouvre une setlist.
2. Utilise la barre de recherche pour trouver une chanson.
3. Clique dessus pour l'ajouter. Les doublons sont évités automatiquement.

**Réorganiser les chansons :**
- Utilise le glisser-déposer pour déplacer les chansons.
- Ou utilise les boutons **Monter / Descendre**.

**Supprimer une chanson :**
- Clique sur l'icône poubelle à côté de la chanson.

**Transposition individuelle :**
- Chaque chanson dans la setlist a ses propres boutons **+ / −** pour ajuster la tonalité indépendamment des autres.

### Blocs de texte

Les blocs de texte permettent d'insérer des notes entre les chansons (annonces, pauses, indications scéniques…).

1. Clique sur **Ajouter une note**.
2. Saisis le texte.
3. Choisis une couleur (blanc, ambre, cyan, violet, rouge) et une taille (petit, moyen, grand).
4. Les blocs peuvent être déplacés par glisser-déposer comme les chansons.

### Renommer une setlist

- Clique sur l'icône stylo à côté du titre de la setlist pour passer en mode édition.
- Modifie le nom et confirme.

### Supprimer une setlist

- Clique sur l'icône poubelle dans la liste des setlists (confirmation demandée).

### Collection Favoris

- Une collection **Favoris** virtuelle regroupe automatiquement toutes tes chansons favorites. Elle est en lecture seule.

---

## 8. Mode performance (Stage Mode)

Le mode performance offre un affichage optimisé pour jouer sur scène.

**Activer le mode performance :**
1. Ouvre une setlist.
2. Clique sur le bouton **Mode performance** (ou **Stage Mode**).

**En mode performance :**
- L'interface est épurée, optimisée pour la lisibilité.
- Les boutons **Précédent / Suivant** permettent de naviguer entre les chansons et les blocs de notes.
- L'index de l'élément courant est affiché (ex. : 3 / 12).
- Il est possible de modifier une chanson directement depuis ce mode.

**Quitter le mode performance :**
- Clique sur le bouton **Quitter** pour revenir à l'éditeur de setlist.

---

## 9. Groupes et collaboration

Les groupes permettent à un ensemble de musiciens de partager et co-éditer des chansons et des setlists.

### Créer un groupe

1. Accède à la vue **Groupes**.
2. Saisis le nom du groupe.
3. Clique sur **Créer**. Tu deviens automatiquement administrateur.

### Inviter des membres

1. Ouvre le groupe souhaité.
2. Dans le champ d'invitation, saisis le **nom d'utilisateur exact** de la personne à inviter.
3. Clique sur **Inviter**. La personne recevra une invitation en attente.

### Accepter ou refuser une invitation

- Les invitations en attente apparaissent dans la vue Groupes et dans la barre latérale.
- Clique sur **Accepter** pour rejoindre le groupe, ou **Refuser** pour décliner.

### Gérer les membres (administrateur)

- Survole un membre pour faire apparaître l'icône de suppression.
- Clique dessus pour retirer la personne du groupe (confirmation demandée).
- Le nom du groupe peut être modifié par l'administrateur via l'icône stylo.

### Quitter un groupe (membre)

- Clique sur **Quitter le groupe** (disponible pour les membres non-administrateurs).

### Chansons et setlists de groupe

- Lors de la création d'une chanson, tu peux la partager avec un groupe pour que tous les membres puissent la modifier.
- Lors de la création d'une setlist, tu peux l'associer à un groupe.

---

## 10. Outils musicaux

### 10.1 Dictionnaire d'accords

Le dictionnaire d'accords affiche les diagrammes de doigtés pour les instruments courants.

**Utilisation :**
1. Accède à **Dictionnaire d'accords** via la navigation.
2. Sélectionne l'instrument : **Guitare**, **Ukulélé** ou **Piano**.
3. Sélectionne la note fondamentale (Do à Si).
4. Sélectionne la qualité de l'accord : Majeur, Mineur, 7, Maj7, Min7, Sus4, Diminué.

**Affichage :**
- **Guitare / Ukulélé** : Diagramme de frettes avec les positions de doigts.
- **Piano** : Clavier avec les touches actives surlignées. La tonique est indiquée par un point rouge. Les noms des notes sont affichés.

### 10.2 Progressions d'accords

L'outil progressions propose plus de 50 progressions classées par genre et ambiance pour s'inspirer ou préparer une composition.

**Utilisation :**
1. Accède à **Progressions** via la navigation.
2. Sélectionne une **tonalité** — toutes les progressions s'adaptent en temps réel.
3. Filtre par **genre** (Pop, Rock, Jazz, Gospel, Blues, Latin…) et/ou **ambiance** (Catchy, Émotionnel, Épique, Sombre…).
4. Utilise la barre de recherche pour trouver une progression par nom ou description.
5. Clique sur **Surprise me** pour une progression aléatoire.

**Détails d'une progression :**
- Clique sur une carte pour ouvrir la vue détaillée.
- Les accords dans la tonalité choisie sont affichés avec la notation en chiffres romains.
- La description inclut des exemples de chansons connues utilisant cette progression.

**Exemples disponibles :**
- I-V-vi-IV (The Axis of Awesome)
- Blues 12 mesures
- ii-V-I Jazz
- Turnaround Gospel
- Canon de Pachelbel
- Bossa Nova
- Et beaucoup d'autres…

---

## 11. Favoris

Les favoris permettent de marquer les chansons que tu utilises souvent pour y accéder rapidement.

**Ajouter un favori :**
- Sur une fiche de chanson, clique sur l'icône **cœur**. Le cœur devient plein pour indiquer que la chanson est en favori (connexion requise).

**Accéder aux favoris :**
- Dans la vue **Setlists**, une collection **Favoris** est disponible en haut de la liste. Elle regroupe automatiquement toutes tes chansons favorites.

**Retirer un favori :**
- Reclique sur l'icône cœur sur la fiche de la chanson.

---

## 12. Export PDF

**Exporter une chanson :**
1. Ouvre la fiche d'une chanson.
2. Clique sur le bouton **Exporter en PDF**.
3. Le fichier est téléchargé avec le titre, l'artiste, la tonalité transposée et le contenu formaté.

**Exporter une setlist :**
1. Ouvre la setlist souhaitée dans la vue Setlists.
2. Clique sur **Exporter en PDF**.
3. Une fenêtre de confirmation s'ouvre avec un titre pré-rempli (nom de la setlist + date).
4. Modifie le titre si nécessaire, puis confirme.
5. Le PDF généré contient toutes les chansons avec leur transposition individuelle appliquée, ainsi que les blocs de texte intercalés.

---

## 13. Installer l'application (PWA)

Unison est une Progressive Web App : elle peut s'installer sur ton téléphone ou ordinateur comme une application native.

**Sur mobile (iOS / Android) :**
- iOS Safari : Menu Partager → "Sur l'écran d'accueil"
- Android Chrome : Menu → "Ajouter à l'écran d'accueil"

**Sur ordinateur :**
- Chrome/Edge : Une icône d'installation apparaît dans la barre d'adresse.
- Une bannière d'installation peut également s'afficher dans l'application au premier chargement.

**Avantages :**
- Accès rapide depuis l'écran d'accueil
- Interface plein écran sans barre de navigation du navigateur
- Meilleures performances

---

## 14. Thème clair / sombre

- Clique sur l'icône **soleil / lune** dans la barre de navigation pour basculer entre le thème clair et le thème sombre.
- La préférence est enregistrée et conservée d'une session à l'autre.

---

## 15. Format des fiches d'accords

Les fiches sont rédigées en texte brut avec une syntaxe simple.

**Accords :**
Les accords s'écrivent entre crochets, sur la ligne au-dessus des paroles correspondantes :
```
[Am]           [F]    [C]
Hello darkness my old friend
```

**Sections :**
Les en-têtes de section s'écrivent entre crochets sur une ligne seule :
```
[Intro]
[Couplet 1]
[Refrain]
[Pont]
[Outro]
```

**Accords supportés :**
- Accords simples : `[C]`, `[Am]`, `[G]`
- Accords avec altérations : `[C#]`, `[Bb]`, `[F#m]`
- Accords de 7e et extensions : `[G7]`, `[Cmaj7]`, `[Am7]`, `[Dm9]`
- Accords suspendus / diminués : `[Gsus4]`, `[Bdim]`
- Accords à basse séparée : `[G/B]`, `[Am/E]`

**Exemple de fiche complète :**
```
[Intro]
[C]  [G]  [Am]  [F]

[Couplet 1]
[C]              [G]
I used to rule the world
[Am]               [F]
Seas would rise when I gave the word

[Refrain]
[F]        [C]
Oh oh oh oh
[G]        [Am]
Oh oh oh oh
```

---

*Documentation générée pour Unison — application PWA pour musiciens.*
