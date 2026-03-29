
import React from 'react';
import {
  Music,
  Search,
  ArrowLeftRight,
  Hash,
  ListMusic,
  Mic2,
  Users,
  FileDown,
  Heart,
  Piano,
  Shuffle,
  Smartphone,
  SunMoon,
  Play,
  ZoomIn,
  Type,
  FileText,
  ChevronLeft,
  ExternalLink
} from 'lucide-react';

interface ChangelogPageProps {
  onBack: () => void;
}

const NOTION_DOC_URL = 'https://east-motorcycle-1da.notion.site/Unison-le-guide-3321b961f5818087b54be8e98023bf67?source=copy_link';

const features = [
  {
    icon: Search,
    title: 'Bibliothèque de chansons',
    items: [
      'Recherche par titre, artiste, genre ou tag',
      'Pagination (50 résultats par page)',
      'Chanson aléatoire "Surprise me"',
    ],
  },
  {
    icon: Music,
    title: 'Fiches d\'accords',
    items: [
      'Affichage des sections (Intro, Couplet, Refrain, Pont…)',
      'Accords alignés au-dessus des paroles',
      'Zoom + / − pour ajuster la taille du texte',
      'Option pour masquer les accords (paroles seules)',
    ],
  },
  {
    icon: Play,
    title: 'Défilement automatique',
    items: [
      'Lecture automatique avec 7 niveaux de vitesse',
      'Pause et reprise à tout moment',
      'Arrêt automatique en fin de chanson',
    ],
  },
  {
    icon: ArrowLeftRight,
    title: 'Transposition',
    items: [
      'Transposition à la volée sans modifier la fiche',
      'Transposition globale ou par chanson dans une setlist',
      'Compatible avec tous les types d\'accords (Am7, C#m, G/B…)',
    ],
  },
  {
    icon: Hash,
    title: 'Notation par degrés',
    items: [
      'Bascule entre notation alphabétique et degrés harmoniques',
      'Système Nashville Number System (1, 5, 6m, b7…)',
      'Préférence conservée pendant la session',
    ],
  },
  {
    icon: FileText,
    title: 'Éditeur de chansons',
    items: [
      'Création et modification de fiches d\'accords',
      'Champs titre, artiste, tonalité, BPM',
      'URL YouTube et audio de référence',
      'Genres, tags personnalisés avec autocomplétion',
      'Visibilité publique, privée ou partagée avec un groupe',
    ],
  },
  {
    icon: ListMusic,
    title: 'Setlists',
    items: [
      'Création et gestion de setlists de concert',
      'Réorganisation par glisser-déposer',
      'Transposition individuelle par chanson',
      'Blocs de texte intercalés (notes, annonces)',
      'Collection Favoris automatique',
    ],
  },
  {
    icon: Mic2,
    title: 'Mode performance (Stage Mode)',
    items: [
      'Interface épurée pour jouer sur scène',
      'Navigation Précédent / Suivant entre les chansons',
      'Modification directe depuis le mode scène',
    ],
  },
  {
    icon: Users,
    title: 'Groupes et collaboration',
    items: [
      'Création de groupes musicaux',
      'Invitation de membres par nom d\'utilisateur',
      'Partage de chansons et setlists avec le groupe',
      'Gestion des rôles (administrateur / membre)',
    ],
  },
  {
    icon: FileDown,
    title: 'Export PDF',
    items: [
      'Export d\'une chanson avec transposition appliquée',
      'Export d\'une setlist complète avec blocs de texte',
      'Titre personnalisable lors de l\'export',
    ],
  },
  {
    icon: Heart,
    title: 'Favoris',
    items: [
      'Ajout/suppression de favoris depuis la fiche',
      'Collection Favoris accessible dans les setlists',
    ],
  },
  {
    icon: Piano,
    title: 'Dictionnaire d\'accords',
    items: [
      'Diagrammes pour guitare, ukulélé et piano',
      'Toutes les qualités : Majeur, Mineur, 7, Maj7, Min7, Sus4, Diminué',
      'Clavier piano interactif avec touches surlignées',
    ],
  },
  {
    icon: Shuffle,
    title: 'Progressions d\'accords',
    items: [
      'Plus de 50 progressions classiques',
      'Adaptées à la tonalité choisie en temps réel',
      'Filtres par genre (Pop, Rock, Jazz, Blues, Latin…) et ambiance',
      'Exemples de chansons connues pour chaque progression',
    ],
  },
  {
    icon: Smartphone,
    title: 'Application installable (PWA)',
    items: [
      'Installation sur mobile (iOS et Android) et ordinateur',
      'Interface plein écran sans barre du navigateur',
      'Icône sur l\'écran d\'accueil',
    ],
  },
  {
    icon: SunMoon,
    title: 'Thème clair / sombre',
    items: [
      'Bascule en un clic depuis la barre de navigation',
      'Préférence enregistrée entre les sessions',
    ],
  },
];

const ChangelogPage: React.FC<ChangelogPageProps> = ({ onBack }) => {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors mb-6"
        >
          <ChevronLeft size={16} />
          Retour
        </button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2.5 py-1 text-xs font-bold bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 rounded-full border border-cyan-200 dark:border-cyan-700">
                v1.0.0
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">Première version</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Nouveautés
            </h1>
            <p className="mt-2 text-slate-500 dark:text-slate-400">
              Toutes les fonctionnalités disponibles dans Unison v1.0.0
            </p>
          </div>

          <a
            href={NOTION_DOC_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold transition-colors border border-slate-200 dark:border-slate-700"
          >
            <ExternalLink size={15} />
            Documentation complète
          </a>
        </div>
      </div>

      <div className="space-y-4">
        {features.map((section) => {
          const Icon = section.icon;
          return (
            <div
              key={section.title}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-900/30 border border-cyan-100 dark:border-cyan-800/50 flex items-center justify-center shrink-0">
                  <Icon size={17} className="text-cyan-600 dark:text-cyan-400" />
                </div>
                <h2 className="font-bold text-slate-800 dark:text-slate-100">{section.title}</h2>
              </div>
              <ul className="space-y-1.5 pl-1">
                {section.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <span className="mt-2 w-1 h-1 rounded-full bg-cyan-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChangelogPage;
