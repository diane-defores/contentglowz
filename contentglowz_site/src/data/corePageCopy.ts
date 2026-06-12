import type { Locale } from './siteShell';

export const handoffPageCopy = {
  launch: {
    en: {
      title: 'Opening ContentGlowz App',
      description: 'Redirecting to the ContentGlowz app.',
      eyebrow: 'Open app',
      heading: 'Opening the app entry...',
      body:
        'The old website handoff has been retired. ContentGlowz now opens the app directly on the app domain, where sign-in and session restore both happen.',
      primaryCta: 'Open app entry',
      secondaryCta: 'Go to sign-in',
    },
    fr: {
      title: "Ouverture de l'application ContentGlowz",
      description: "Redirection vers l'application ContentGlowz.",
      eyebrow: "Ouvrir l'app",
      heading: "Ouverture de l'entrée de l'app...",
      body:
        "L'ancien handoff du site a été retiré. ContentGlowz ouvre maintenant l'app directement sur le domaine de l'app, où la connexion et la restauration de session se font.",
      primaryCta: "Ouvrir l'entrée de l'app",
      secondaryCta: 'Aller à la connexion',
    },
  },
  signIn: {
    en: {
      title: 'Redirecting to App Sign-In - ContentGlowz',
      description: 'Redirecting to the official ContentGlowz app sign-in flow.',
      eyebrow: 'App auth',
      heading: 'Redirecting to the app sign-in...',
      body:
        'ContentGlowz authentication now runs directly on app.contentglowz.com with the official Clerk web flow.',
      primaryCta: 'Continue with Google',
    },
    fr: {
      title: "Redirection vers la connexion de l'app - ContentGlowz",
      description: "Redirection vers le flux officiel de connexion de l'app ContentGlowz.",
      eyebrow: "Connexion à l'app",
      heading: "Redirection vers la connexion de l'app...",
      body:
        "L'authentification ContentGlowz se fait maintenant directement sur app.contentglowz.com avec le flux web officiel de Clerk.",
      primaryCta: 'Continuer avec Google',
    },
  },
  signUp: {
    en: {
      title: 'Redirecting to App Sign-In - ContentGlowz',
      description: 'Redirecting to the official ContentGlowz app sign-in flow.',
      eyebrow: 'Account access',
      heading: 'Account creation moved to the app domain.',
      body:
        'ContentGlowz no longer creates accounts on the marketing site. The official Clerk Google flow now lives directly on the app.',
      primaryCta: 'Continue with Google',
    },
    fr: {
      title: "Redirection vers la connexion de l'app - ContentGlowz",
      description: "Redirection vers le flux officiel de connexion de l'app ContentGlowz.",
      eyebrow: 'Accès au compte',
      heading: "La création de compte a été déplacée vers le domaine de l'app.",
      body:
        "ContentGlowz ne crée plus de comptes sur le site marketing. Le flux officiel Google de Clerk vit maintenant directement dans l'app.",
      primaryCta: 'Continuer avec Google',
    },
  },
} as const;

export const privacyPageCopy = {
  en: {
    title: 'Privacy Policy | ContentGlowz',
    description:
      'How ContentGlowz uses your data and how to manage your analytics preferences.',
    heading: 'Privacy Policy',
    lastUpdated: 'Last updated: March 2026',
    sections: [
      {
        heading: 'Data Collected',
        paragraphs: [
          'ContentGlowz uses its own lightweight, cookie-free analytics to understand how your sites are used: pages visited, referral source, UTM campaign parameters, and device type. No personally identifiable information is collected: no IP addresses are stored, no browser fingerprinting is used, and no third-party tracking scripts are loaded.',
        ],
      },
      {
        heading: 'Cookie-Free by Design',
        paragraphs: [
          'Our analytics system does not use cookies, localStorage, or any client-side storage mechanism. Each pageview is an independent, anonymous event. This means no consent banner is required, and the approach is designed to stay aligned with GDPR, CCPA, ePrivacy, and PECR requirements.',
        ],
      },
      {
        heading: 'Data Hosting',
        paragraphs: [
          'All analytics data is processed and stored exclusively in the European Union. We do not share data with third parties, advertising networks, or data brokers. You can export your data at any time from the dashboard.',
        ],
      },
      {
        heading: 'What We Track',
        bullets: [
          'Page URL and path (which pages are visited)',
          'Referrer (where visitors come from)',
          'UTM parameters (campaign tracking)',
          'Device type, browser, and OS (parsed server-side from the user-agent)',
          'Country (derived from CDN headers, with no IP stored)',
        ],
      },
      {
        heading: "What We Don't Track",
        bullets: [
          'IP addresses (never stored)',
          'Individual visitors (no session or visitor IDs)',
          'Browser fingerprints',
          'Scroll position, mouse movements, or clicks',
          'Form inputs or personal data',
        ],
      },
      {
        heading: 'Contact',
        paragraphs: [
          'For any data-related questions, contact us through the official channels listed on the site.',
        ],
      },
    ],
  },
  fr: {
    title: 'Politique de confidentialite | ContentGlowz',
    description:
      'Comment ContentGlowz utilise tes donnees et comment gerer tes preferences liees aux analytics.',
    heading: 'Politique de confidentialite',
    lastUpdated: 'Derniere mise a jour : mars 2026',
    sections: [
      {
        heading: 'Donnees collectees',
        paragraphs: [
          "ContentGlowz utilise ses propres analytics legers et sans cookies pour comprendre comment tes sites sont utilises : pages visitees, source de reference, parametres de campagne UTM et type d'appareil. Aucune information personnellement identifiable n'est collectee : aucune adresse IP n'est stockee, aucun fingerprint navigateur n'est utilise et aucun script de suivi tiers n'est charge.",
        ],
      },
      {
        heading: 'Sans cookies par conception',
        paragraphs: [
          "Notre systeme d'analytics n'utilise ni cookies, ni localStorage, ni autre mecanisme de stockage cote client. Chaque page vue est un evenement independant et anonyme. Cela signifie qu'aucune banniere de consentement n'est requise, et l'approche est concue pour rester alignee avec les exigences du RGPD, du CCPA, d'ePrivacy et du PECR.",
        ],
      },
      {
        heading: 'Hebergement des donnees',
        paragraphs: [
          "Toutes les donnees d'analytics sont traitees et stockees exclusivement dans l'Union europeenne. Nous ne partageons pas ces donnees avec des tiers, des reseaux publicitaires ou des courtiers en donnees. Tu peux exporter tes donnees a tout moment depuis le dashboard.",
        ],
      },
      {
        heading: 'Ce que nous suivons',
        bullets: [
          'URL et chemin de la page (quelles pages sont visitees)',
          "Referent (d'ou viennent les visiteurs)",
          'Parametres UTM (suivi de campagne)',
          "Type d'appareil, navigateur et OS (analyses cote serveur depuis le user-agent)",
          "Pays (derive des headers CDN, sans stockage d'IP)",
        ],
      },
      {
        heading: 'Ce que nous ne suivons pas',
        bullets: [
          'Adresses IP (jamais stockees)',
          'Visiteurs individuels (aucun identifiant de session ou de visiteur)',
          'Empreintes navigateur',
          'Position de scroll, mouvements de souris ou clics',
          'Saisies de formulaire ou donnees personnelles',
        ],
      },
      {
        heading: 'Contact',
        paragraphs: [
          'Pour toute question liee aux donnees, contacte-nous via les canaux officiels listes sur le site.',
        ],
      },
    ],
  },
} as const;

export function getHandoffCopy(
  page: keyof typeof handoffPageCopy,
  locale: Locale,
) {
  return handoffPageCopy[page][locale];
}

export function getPrivacyCopy(locale: Locale) {
  return privacyPageCopy[locale];
}
