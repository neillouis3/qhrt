import type { MessageTree } from '@/lib/i18n/messages';

/** Tagalog UI strings (app chrome; session content may stay in English). */
export const tl: MessageTree = {
  nav: {
    home: 'Home',
    sessions: 'Mga session',
    diary: 'Talaarawan',
    assessments: 'Mga pokus',
    journeys: 'Mga paglalakbay',
    about: 'Tungkol sa amin',
    contact: 'Makipag-ugnayan',
    login: 'Mag-log in',
    signup: 'Gumawa ng account',
    dashboard: 'Pumunta sa dashboard',
  },
  settings: {
    title: 'Mga setting',
    group: {
      account: 'Account',
      preferences: 'Mga kagustuhan',
      support: 'Suporta',
    },
    tab: {
      profile: 'Profile',
      data: 'Iyong data',
      home: 'Home',
      appearance: 'Itsura',
      help: 'Tulong',
    },
    appearance: {
      title: 'Itsura',
      theme: 'Tema',
      themePlaceholder: 'Tema',
      language: 'Wika',
      languageDescription:
        'Mga menu at karaniwang label ng app. Ang nilalaman ng session ay nananatili sa orihinal na wika sa ngayon.',
    },
    theme: {
      light: 'Maliwanag',
      dark: 'Madilim',
      system: 'Tulad ng device',
    },
    home: {
      title: 'Home',
      checkIn: 'Check-in sa home',
      checkInDescription: 'Ipakita ang thumbs up sa Home.',
      practiceTime: 'Kailan ka karaniwang nagprapraktis',
      practicePlaceholder: 'Kapag may oras ako',
    },
    profile: {
      save: 'I-save',
      saved: 'Na-save ang profile.',
    },
    data: {
      title: 'Iyong data',
      download: 'I-download ang aking data',
    },
    help: {
      title: 'Tulong',
      logout: 'Mag-log out',
      privacy: 'Privacy',
      terms: 'Mga tuntunin',
      contact: 'Makipag-ugnayan',
    },
  },
  home: {
    greeting: {
      hello: 'Kumusta',
      morning: 'Magandang umaga',
      afternoon: 'Magandang hapon',
      evening: 'Magandang gabi',
    },
    checkIn: {
      prompt: 'Mabilis na wellness check — paano ang araw mo?',
      up: 'Magandang balita. Malaki ang maitutulong ng maliliit na gawi.',
      down: 'May mahirap na araw. Isang maliit na hakbang kapag handa ka na.',
    },
    browse: {
      title: 'O mag-browse',
      sessions: 'Mga session',
      diary: 'Talaarawan',
      assessments: 'Mga pokus',
      journeys: 'Mga paglalakbay',
      breathe: 'Humininga',
    },
    presence: {
      one: 'Dumating ka 1 araw ngayong linggo.',
      many: 'Dumating ka {count} araw ngayong linggo.',
    },
    checkInWeek: 'Iyong wellness check-in ngayong linggo',
    pinned: 'Naka-pin',
    tagline: 'Wellness at resilience coaching',
    nextStep: {
      label: 'Iminumungkahing susunod na hakbang',
      loading: 'Nilo-load ang iyong dashboard…',
    },
    recent: 'Magpatuloy kung saan ka tumigil',
    tutorial: {
      title: 'Pagsisimula',
      progress: '{done} sa {total} tapos na',
      then: 'Susunod',
      go: 'Pumunta',
    },
    shortcuts: {
      focusTitle: 'Mga pokus',
      focusDescription:
        'Mga gabay na workbook ayon sa mga layuning pinili mo — hindi clinical na assessment.',
      focusCta: 'Tingnan ang mga workbook',
      diaryTitle: 'Talaarawan ng pagmumuni-muni',
      diaryDescription: 'Maikling tala tungkol sa stress, gawi, o kung paano ang araw.',
      diaryCta: 'Sumulat',
    },
    diary: {
      section: 'Talaarawan ng pagmumuni-muni',
      emptyTitle: 'Wala pang entry',
      emptyDescription:
        'Isang linya tungkol sa stress, boundaries, o tagumpay — opsyonal at pribado.',
      emptyCta: 'Unang entry',
      open: 'Buksan ang talaarawan',
      entriesWeek: 'Mga entry ngayong linggo',
      streak: 'Sunod-sunod na araw',
      avgWeek: 'Average ngayong linggo',
      today: 'Ngayon',
      last7: 'Huling 7 araw',
      written: 'Nasulat na',
    },
    pinnedHint: 'Mabilis na paraan para magpatuloy kapag may ilang minuto ka.',
    checkInAria: {
      doingWell: 'Maayos ang lagay',
      toughDay: 'Mahirap na araw',
      week: 'Wellness check-in ngayong linggo',
      dayUp: '{day}: maayos',
      dayDown: '{day}: mahirap',
      dayNone: '{day}: walang check-in',
    },
  },
  time: {
    night: 'Gabi',
    dawn: 'Bukang-liwayway',
    morning: 'Umaga',
    afternoon: 'Hapon',
    evening: 'Gabi',
  },
  crisis: {
    compactStart:
      'Ang QHRT ay coaching at edukasyon, hindi therapy o crisis care. Sa US at Canada, tumawag o mag-text sa ',
    compactMiddle: ' para sa Suicide & Crisis Lifeline, o ',
    compactEnd: ' sa emergency.',
    intro:
      'Ang QHRT ay self-paced na wellness coaching, hindi therapy o emergency care. Kung may panganib ka o kailangan mo ng agarang tulong, gamitin ang mga mapagkukunan sa ibaba.',
    line988: '988 Suicide & Crisis Lifeline (US at Canada)',
    line988Detail: 'Tumawag o mag-text sa 988, 24/7.',
    emergency: 'Emergency services',
    emergencyDetail:
      'Kung agarang panganib, tumawag sa 911 (US/Canada) o sa lokal na emergency number.',
  },
};
