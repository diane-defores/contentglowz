export type Locale = 'en' | 'fr';

export interface HreflangLink {
  hrefLang: 'en' | 'fr';
  href: string;
}

export interface NavLink {
  href: string;
  label: string;
}

export interface FooterLinkGroup {
  heading: string;
  links: NavLink[];
}

const localizedCoreRoutes = {
  home: {
    en: '/',
    fr: '/fr',
  },
  launch: {
    en: '/launch',
    fr: '/fr/launch',
  },
  signIn: {
    en: '/sign-in',
    fr: '/fr/sign-in',
  },
  signUp: {
    en: '/sign-up',
    fr: '/fr/sign-up',
  },
  privacy: {
    en: '/privacy',
    fr: '/fr/privacy',
  },
  blog: {
    en: '/blog',
    fr: '/fr/blog',
  },
} as const;

const localeLabels = {
  en: {
    skipToContent: 'Skip to content',
    mainNavigation: 'Main navigation',
    toggleNavigationMenu: 'Toggle navigation menu',
    features: 'Features',
    robots: 'Robots',
    pricing: 'Pricing',
    whoItsFor: "Who It's For",
    faq: 'FAQ',
    blog: 'Blog',
    openApp: 'Open App',
    continueWithGoogle: 'Continue with Google',
    product: 'Product',
    resources: 'Resources',
    legal: 'Legal',
    testimonials: 'Testimonials',
    privacy: 'Privacy',
    tagline: 'AI content pipeline. Swipe to publish.',
    rightsReserved: 'All rights reserved.',
    localeSwitch: 'FR',
    localeSwitchLabel: 'Voir cette page en français',
  },
  fr: {
    skipToContent: 'Aller au contenu',
    mainNavigation: 'Navigation principale',
    toggleNavigationMenu: 'Ouvrir ou fermer le menu de navigation',
    features: 'Fonctionnalités',
    robots: 'Robots',
    pricing: 'Tarifs',
    whoItsFor: 'Pour qui',
    faq: 'FAQ',
    blog: 'Blog',
    openApp: "Ouvrir l'app",
    continueWithGoogle: 'Continuer avec Google',
    product: 'Produit',
    resources: 'Ressources',
    legal: 'Légal',
    testimonials: 'Témoignages',
    privacy: 'Confidentialité',
    tagline: 'Pipeline de contenu IA. Glisse pour publier.',
    rightsReserved: 'Tous droits réservés.',
    localeSwitch: 'EN',
    localeSwitchLabel: 'View this page in English',
  },
} as const;

const localeHomeHref: Record<Locale, string> = {
  en: '/',
  fr: '/fr',
};

function normalizePathname(pathname: string) {
  if (!pathname || pathname === '/') {
    return '/';
  }

  return pathname.replace(/\/+$/, '');
}

export function detectLocaleFromPath(pathname: string): Locale {
  return normalizePathname(pathname).startsWith('/fr') ? 'fr' : 'en';
}

export function getCoreAlternates(routeKey: keyof typeof localizedCoreRoutes): HreflangLink[] {
  const route = localizedCoreRoutes[routeKey];

  return [
    { hrefLang: 'en', href: route.en },
    { hrefLang: 'fr', href: route.fr },
  ];
}

export function getLocaleSwitchTarget(pathname: string) {
  const normalizedPath = normalizePathname(pathname);

  for (const route of Object.values(localizedCoreRoutes)) {
    if (normalizedPath === route.en) {
      return {
        href: route.fr,
        label: localeLabels.en.localeSwitch,
        ariaLabel: localeLabels.en.localeSwitchLabel,
      };
    }

    if (normalizedPath === route.fr) {
      return {
        href: route.en,
        label: localeLabels.fr.localeSwitch,
        ariaLabel: localeLabels.fr.localeSwitchLabel,
      };
    }
  }

  return null;
}

export function getNavbarContent(locale: Locale) {
  const labels = localeLabels[locale];
  const homeHref = localeHomeHref[locale];

  return {
    skipToContent: labels.skipToContent,
    mainNavigation: labels.mainNavigation,
    toggleNavigationMenu: labels.toggleNavigationMenu,
    brandHref: homeHref,
    primaryLinks: [
      { href: `${homeHref}#features`, label: labels.features },
      { href: `${homeHref}#robots`, label: labels.robots },
      { href: `${homeHref}#pricing`, label: labels.pricing },
      { href: `${homeHref}#who-its-for`, label: labels.whoItsFor },
      { href: `${homeHref}#faq`, label: labels.faq },
      { href: locale === 'fr' ? '/fr/blog' : '/blog', label: labels.blog },
    ] satisfies NavLink[],
    appLinkLabel: labels.openApp,
    authLinkLabel: labels.continueWithGoogle,
  };
}

export function getFooterContent(locale: Locale) {
  const labels = localeLabels[locale];
  const homeHref = localeHomeHref[locale];

  return {
    brandHref: homeHref,
    tagline: labels.tagline,
    rightsReserved: labels.rightsReserved,
    linkGroups: [
      {
        heading: labels.product,
        links: [
          { href: `${homeHref}#robots`, label: labels.robots },
          { href: `${homeHref}#features`, label: labels.features },
          { href: `${homeHref}#pricing`, label: labels.pricing },
          { href: `${homeHref}#who-its-for`, label: labels.whoItsFor },
        ],
      },
      {
        heading: labels.resources,
        links: [{ href: locale === 'fr' ? '/fr/blog' : '/blog', label: labels.blog }],
      },
      {
        heading: labels.legal,
        links: [{ href: locale === 'fr' ? '/fr/privacy' : '/privacy', label: labels.privacy }],
      },
    ] satisfies FooterLinkGroup[],
    bottomLinks: [
      { href: locale === 'fr' ? '/fr/privacy' : '/privacy', label: labels.privacy },
    ] satisfies NavLink[],
  };
}
