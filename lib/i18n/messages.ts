import type { AppLocale } from '@/lib/locale';
import { hi } from '@/lib/i18n/localeMessages/hi';
import { tl } from '@/lib/i18n/localeMessages/tl';

export type MessageTree = { [key: string]: string | MessageTree };

const en: MessageTree = {
  nav: {
    home: 'Home',
    diary: 'Diary',
    assessments: 'Modules',
    about: 'About',
    contact: 'Contact',
    login: 'Log in',
    signup: 'Sign up',
    dashboard: 'Go to your dashboard',
  },
  settings: {
    title: 'Settings',
    group: {
      account: 'Profile',
      preferences: 'Preferences',
      support: 'Support',
    },
    tab: {
      profile: 'Account',
      notifications: 'Notifications',
      data: 'Your data',
      home: 'Home',
      appearance: 'Appearance',
      help: 'Help',
    },
    appearance: {
      title: 'Appearance',
      theme: 'Theme',
      themePlaceholder: 'Theme',
      language: 'Language',
      languageDescription: 'App menus and common labels. Session content stays in its original language for now.',
    },
    theme: {
      light: 'Light',
      dark: 'Dark',
      system: 'Match device',
    },
    home: {
      title: 'Home',
      checkIn: 'Home check-in',
      checkInDescription: 'Show the thumbs-up prompt on Home.',
      practiceTime: 'When you usually practice',
      practicePlaceholder: 'Whenever I can',
    },
    profile: {
      save: 'Save',
      saved: 'Profile saved.',
    },
    data: {
      title: 'Your data',
      download: 'Download my data',
    },
    help: {
      title: 'Help',
      logout: 'Log out',
      privacy: 'Privacy',
      terms: 'Terms',
      contact: 'Contact',
    },
  },
  home: {
    greeting: {
      hello: 'Hello',
      morning: 'Good morning',
      afternoon: 'Good afternoon',
      evening: 'Good evening',
    },
    checkIn: {
      prompt: 'How is today feeling?',
      up: 'Good to hear. Small habits add up.',
      down: 'Rough days happen. Pick one small step when you are ready.',
    },
    browse: {
      title: 'Or browse',
      diary: 'Diary',
      assessments: 'Modules',
      breathe: 'Breathe',
    },
    presence: {
      one: 'You showed up 1 day this week.',
      many: 'You showed up {count} days this week.',
    },
    checkInWeek: 'Your wellness check-ins this week',
    notifications: 'Notifications',
    notificationsEmpty: 'No notifications yet.',
    notificationsWelcome: 'Welcome. We are glad to have you here.',
    pinned: 'Pinned',
    nextStep: {
      label: 'Suggested next step',
      loading: 'Loading your dashboard…',
    },
    recent: 'Pick up where you left off',
    tutorial: {
      title: 'Getting started',
      progress: '{done} of {total} complete',
      then: 'Then',
      go: 'Go',
      again: 'Try again',
    },
    modules: 'Modules',
    shortcuts: {
      focusTitle: 'Modules',
      focusDescription: 'Guided workbooks matched to goals you choose, not a clinical assessment.',
      focusCta: 'Browse workbooks',
      diaryTitle: 'Reflection diary',
      diaryDescription: 'A short note on stress, habits, or how the day felt.',
      diaryCta: 'Write',
    },
    diary: {
      section: 'Reflection diary',
      emptyTitle: 'No entries yet',
      emptyDescription: 'Write a short note about your day.',
      emptyCta: 'Write first entry',
      open: 'Open diary',
      entriesWeek: 'Entries this week',
      streak: 'Day streak',
      avgWeek: 'Avg reflection this week',
      today: 'Today',
      last7: 'Last 7 days',
      written: 'Written',
    },
    pinnedHint: 'Quick ways to continue when you have a few minutes.',
    checkInAria: {
      doingWell: 'Doing well',
      toughDay: 'Tough day',
      week: 'Wellness check-ins this week',
      dayUp: '{day}: doing well',
      dayDown: '{day}: tough day',
      dayNone: '{day}: no check-in',
    },
  },
  time: {
    night: 'Night',
    dawn: 'Dawn',
    morning: 'Morning',
    afternoon: 'Afternoon',
    evening: 'Evening',
  },
  crisis: {
    compactStart:
      'QHRT is coaching and education, not therapy or crisis care. In the US and Canada, call or text ',
    compactMiddle: ' for the Suicide & Crisis Lifeline, or ',
    compactEnd: ' in an emergency.',
    intro:
      'QHRT is self-paced wellness coaching, not therapy or emergency care. If you are in danger or need urgent help, use the resources below.',
    line988: '988 Suicide & Crisis Lifeline (US & Canada)',
    line988Detail: 'Call or text 988, 24/7.',
    emergency: 'Emergency services',
    emergencyDetail:
      'If you are in immediate danger, call 911 (US/Canada) or your local emergency number.',
  },
};

const fr: MessageTree = {
  nav: {
    home: 'Accueil',
    diary: 'Journal',
    assessments: 'Modules',
    about: 'À propos',
    contact: 'Contact',
    login: 'Connexion',
    signup: 'Créer un compte',
    dashboard: 'Aller au tableau de bord',
  },
  settings: {
    title: 'Paramètres',
    group: {
      account: 'Profil',
      preferences: 'Préférences',
      support: 'Aide',
    },
    tab: {
      profile: 'Compte',
      notifications: 'Notifications',
      data: 'Vos données',
      home: 'Accueil',
      appearance: 'Apparence',
      help: 'Aide',
    },
    appearance: {
      title: 'Apparence',
      theme: 'Thème',
      themePlaceholder: 'Thème',
      language: 'Langue',
      languageDescription:
        'Menus et libellés courants. Le contenu des séances reste dans sa langue d’origine pour l’instant.',
    },
    theme: {
      light: 'Clair',
      dark: 'Sombre',
      system: 'Comme l’appareil',
    },
    home: {
      title: 'Accueil',
      checkIn: 'Bilan du jour',
      checkInDescription: 'Afficher les pouces sur l’accueil.',
      practiceTime: 'Quand vous pratiquez habituellement',
      practicePlaceholder: 'Quand je peux',
    },
    profile: {
      save: 'Enregistrer',
      saved: 'Profil enregistré.',
    },
    data: {
      title: 'Vos données',
      download: 'Télécharger mes données',
    },
    help: {
      title: 'Aide',
      logout: 'Se déconnecter',
      privacy: 'Confidentialité',
      terms: 'Conditions',
      contact: 'Contact',
    },
  },
  home: {
    greeting: {
      hello: 'Bonjour',
      morning: 'Bonjour',
      afternoon: 'Bon après-midi',
      evening: 'Bonsoir',
    },
    checkIn: {
      prompt: 'Comment se passe la journée?',
      up: 'Merci. Les petites habitudes comptent.',
      down: 'Les journées difficiles arrivent. Un petit pas quand vous voulez.',
    },
    browse: {
      title: 'Ou parcourir',
      diary: 'Journal',
      assessments: 'Modules',
      breathe: 'Respiration',
    },
    presence: {
      one: 'Vous êtes venu·e 1 jour cette semaine.',
      many: 'Vous êtes venu·e {count} jours cette semaine.',
    },
    checkInWeek: 'Vos bilans cette semaine',
    notifications: 'Notifications',
    notificationsEmpty: 'Aucune notification.',
    notificationsWelcome: 'Bienvenue. Nous sommes contents de vous avoir ici.',
    pinned: 'Épinglé',
    nextStep: {
      label: 'Prochaine étape suggérée',
      loading: 'Chargement de votre accueil…',
    },
    recent: 'Reprendre là où vous en étiez',
    tutorial: {
      title: 'Premiers pas',
      progress: '{done} sur {total} terminé(s)',
      then: 'Ensuite',
      go: 'Aller',
      again: 'Réessayer',
    },
    modules: 'Modules',
    shortcuts: {
      focusTitle: 'Modules',
      focusDescription: 'Cahiers guidés selon vos objectifs, pas une évaluation clinique.',
      focusCta: 'Parcourir les cahiers',
      diaryTitle: 'Journal de réflexion',
      diaryDescription: 'Une note sur le stress, les habitudes ou votre journée.',
      diaryCta: 'Écrire',
    },
    diary: {
      section: 'Journal de réflexion',
      emptyTitle: 'Aucune entrée',
      emptyDescription: 'Écrivez une courte note sur votre journée.',
      emptyCta: 'Première entrée',
      open: 'Ouvrir le journal',
      entriesWeek: 'Entrées cette semaine',
      streak: 'Jours d’affilée',
      avgWeek: 'Moyenne cette semaine',
      today: 'Aujourd’hui',
      last7: '7 derniers jours',
      written: 'Écrit',
    },
    pinnedHint: 'Reprendre vite quand vous avez quelques minutes.',
    checkInAria: {
      doingWell: 'Ça va',
      toughDay: 'Journée difficile',
      week: 'Bilans bien-être cette semaine',
      dayUp: '{day} : ça va',
      dayDown: '{day} : difficile',
      dayNone: '{day} : pas de bilan',
    },
  },
  time: {
    night: 'Nuit',
    dawn: 'Aube',
    morning: 'Matin',
    afternoon: 'Après-midi',
    evening: 'Soir',
  },
  crisis: {
    compactStart:
      'QHRT est du coaching éducatif, pas une thérapie ni un service de crise. Aux É.-U. et au Canada, composez le ',
    compactMiddle: ' (ligne de crise) ou le ',
    compactEnd: ' en urgence.',
    intro:
      'QHRT est du coaching bien-être autoguidé, pas une thérapie ni un service d’urgence. Si vous êtes en danger, utilisez les ressources ci-dessous.',
    line988: 'Ligne 988 — suicide et crise (É.-U. et Canada)',
    line988Detail: 'Appelez ou textez le 988, 24 h/24.',
    emergency: 'Services d’urgence',
    emergencyDetail:
      'En danger immédiat, composez le 911 (É.-U./Canada) ou le numéro d’urgence local.',
  },
};

export const messages: Record<AppLocale, MessageTree> = { en, fr, tl, hi };

function resolve(tree: MessageTree, key: string): string | undefined {
  const parts = key.split('.');
  let node: string | MessageTree | undefined = tree;
  for (const part of parts) {
    if (!node || typeof node === 'string') return undefined;
    node = node[part];
  }
  return typeof node === 'string' ? node : undefined;
}

export function translate(
  locale: AppLocale,
  key: string,
  params?: Record<string, string | number>
): string {
  const value = resolve(messages[locale], key) ?? resolve(messages.en, key) ?? key;
  if (!params) return value;
  return Object.entries(params).reduce(
    (text, [param, replacement]) => text.replace(`{${param}}`, String(replacement)),
    value
  );
}
