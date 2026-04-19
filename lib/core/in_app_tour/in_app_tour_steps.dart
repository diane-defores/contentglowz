import 'in_app_tour_step.dart';

/// Étapes de la visite guidée in-app, en français.
///
/// L'ordre suit le parcours logique : créer → valider → publier → analyser →
/// configurer. Chaque étape pointe vers l'écran qu'elle décrit pour que
/// l'utilisateur voie en direct ce dont on parle.
const List<InAppTourStep> kInAppTourSteps = [
  InAppTourStep(
    id: 'welcome',
    title: 'Bienvenue dans ContentFlow',
    description:
        'On va faire un tour rapide de l\'app, écran par écran. '
        'L\'idée : vous montrer dans quel ordre utiliser les pages, '
        'à quoi sert chaque bouton, et comment tirer le meilleur de la plateforme. '
        'Vous pourrez mettre en pause à tout moment et reprendre depuis les paramètres.',
  ),
  InAppTourStep(
    id: 'feed',
    routePath: '/feed',
    title: 'Le Feed — votre file de validation',
    description:
        'C\'est ici que vous validez chaque contenu généré par l\'IA. '
        'Vous pouvez balayer la carte (swipe) ou utiliser les trois boutons ronds en bas : '
        'le bouton de gauche passe le contenu (rejet), celui du milieu ouvre l\'éditeur pour modifier, '
        'celui de droite publie/approuve. Le badge rouge sur l\'icône Feed indique combien de contenus attendent votre revue.',
    hint: 'Repérez les 3 boutons ronds en bas — ce sont vos actions principales.',
  ),
  InAppTourStep(
    id: 'calendar',
    routePath: '/calendar',
    title: 'Calendrier — vos posts planifiés',
    description:
        'Le calendrier affiche tout ce qui est programmé pour publication. '
        'Cliquez sur une semaine en haut pour filtrer la vue. '
        'Utile pour vérifier l\'équilibre de votre planning et repérer les jours vides ou surchargés.',
  ),
  InAppTourStep(
    id: 'history',
    routePath: '/history',
    title: 'Historique — tout ce qui est publié',
    description:
        'Retrouvez ici tous les contenus déjà publiés, avec leur statut et la plateforme cible. '
        'C\'est votre archive : si vous voulez vérifier qu\'un post est bien parti, ou réutiliser une idée passée, c\'est par ici.',
  ),
  InAppTourStep(
    id: 'drip',
    routePath: '/drip',
    title: 'Drip — séquences automatisées',
    description:
        'Drip orchestre des séquences de contenu sur plusieurs jours. '
        'Au lieu de publier un post isolé, vous lancez une série cohérente (par exemple, une mini-campagne de 5 posts sur un thème). '
        'À utiliser pour les lancements ou les sujets qui méritent plusieurs angles.',
  ),
  InAppTourStep(
    id: 'content_tools',
    routePath: '/content-tools',
    title: 'Content Tools — vérifications & audit',
    description:
        'Boîte à outils qui vérifie la qualité de vos contenus avant publication : '
        'cohérence éditoriale, audit du funnel, validations. '
        'Pensez à passer ici quand un contenu vous semble bizarre — l\'audit donne souvent la raison.',
  ),
  InAppTourStep(
    id: 'templates',
    routePath: '/templates',
    title: 'Templates — vos modèles réutilisables',
    description:
        'Les templates sont vos formats récurrents (article long, post court, séquence). '
        'L\'IA s\'appuie dessus pour générer des contenus cohérents avec votre style. '
        'Plus vos templates sont précis, plus la génération colle à votre voix.',
  ),
  InAppTourStep(
    id: 'newsletter',
    routePath: '/newsletter',
    title: 'Newsletter — votre canal long format',
    description:
        'L\'écran Newsletter regroupe la création, l\'aperçu et l\'envoi de vos newsletters. '
        'Vous pouvez assembler plusieurs contenus du Feed dans une même édition. '
        'Idéal pour transformer une semaine de production en un envoi unique.',
  ),
  InAppTourStep(
    id: 'reels',
    routePath: '/reels',
    title: 'Reels — formats vidéo courts',
    description:
        'Gérez ici vos contenus vidéo courts (reels, shorts, TikTok). '
        'L\'IA propose scripts et découpages — à vous de valider ou d\'éditer avant publication. '
        'Le Feed central garde la priorité, Reels est l\'atelier dédié au format vertical.',
  ),
  InAppTourStep(
    id: 'affiliations',
    routePath: '/affiliations',
    title: 'Affiliations — vos liens monétisés',
    description:
        'Centralisez vos liens d\'affiliation pour que l\'IA les insère intelligemment dans les contenus pertinents. '
        'Ajoutez un lien une seule fois ici, il sera proposé automatiquement quand le sujet s\'y prête.',
  ),
  InAppTourStep(
    id: 'research',
    routePath: '/research',
    title: 'Research — nourrir votre stratégie',
    description:
        'Research collecte les sujets tendance, la veille concurrentielle et les questions de votre audience. '
        'C\'est l\'écran à consulter avant chaque rituel de planification : il vous dit quoi traiter cette semaine.',
  ),
  InAppTourStep(
    id: 'seo',
    routePath: '/seo',
    title: 'SEO — visibilité organique',
    description:
        'Analyse SEO de vos contenus et opportunités de mots-clés. '
        'Avant de lancer une série Drip ou un article long, passez ici pour ajuster les angles aux requêtes qui rapportent.',
  ),
  InAppTourStep(
    id: 'analytics',
    routePath: '/analytics',
    title: 'Analytics — mesurer l\'impact',
    description:
        'Le tableau de bord global : audience, engagement, croissance. '
        'C\'est votre première escale hebdomadaire pour savoir ce qui marche. '
        'Regardez les grandes tendances ici, puis descendez dans Performance pour le détail.',
  ),
  InAppTourStep(
    id: 'performance',
    routePath: '/performance',
    title: 'Performance — métriques fines',
    description:
        'Performance complète Analytics avec des métriques par contenu et par canal. '
        'À utiliser quand vous voulez comprendre pourquoi un post a marché (ou pas) et reproduire le succès.',
  ),
  InAppTourStep(
    id: 'runs',
    routePath: '/runs',
    title: 'Runs — historique des jobs IA',
    description:
        'Chaque génération IA laisse une trace ici : quel modèle, quel prompt, combien de temps. '
        'À consulter en cas de doute sur un résultat ou pour suivre les coûts.',
  ),
  InAppTourStep(
    id: 'activity',
    routePath: '/activity',
    title: 'Activité — timeline système',
    description:
        'Le journal chronologique de tout ce qui se passe dans votre workspace : créations, publications, erreurs. '
        'Utile pour le diagnostic quand quelque chose semble n\'avoir pas fonctionné.',
  ),
  InAppTourStep(
    id: 'personas',
    routePath: '/personas',
    title: 'Personas — vos audiences cibles',
    description:
        'Définissez les personas que l\'IA doit adresser. Chaque persona influence le ton, le vocabulaire et les angles. '
        'Le bouton « + » en bas à droite ouvre le formulaire pour ajouter une nouvelle persona.',
    hint: 'Le bouton + en bas à droite sert à ajouter une persona.',
  ),
  InAppTourStep(
    id: 'work_domains',
    routePath: '/work-domains',
    title: 'Domaines de travail',
    description:
        'Configurez les domaines thématiques sur lesquels l\'IA est autorisée à produire. '
        'Cela évite les hors-sujets et concentre la production sur vos vrais terrains d\'expertise.',
  ),
  InAppTourStep(
    id: 'uptime',
    routePath: '/uptime',
    title: 'Uptime — état technique',
    description:
        'Vérifiez ici la santé du backend. Si l\'app passe en mode dégradé, cet écran vous dit pourquoi et quand le service revient.',
  ),
  InAppTourStep(
    id: 'settings',
    routePath: '/settings',
    title: 'Paramètres — tout personnaliser',
    description:
        'Centre de contrôle : langue, fréquence de génération, canaux de publication, notifications, rituel hebdomadaire. '
        'C\'est aussi ici que vous trouverez le bouton « Visite guidée de l\'app » pour relancer ou reprendre cette visite à tout moment.',
    hint: 'Cherchez le tile « Visite guidée de l\'app » pour relancer la visite.',
  ),
  InAppTourStep(
    id: 'completion',
    title: 'Vous êtes prêt !',
    description:
        'Vous avez vu l\'essentiel. Quelques rappels pour bien démarrer : '
        '1) commencez par configurer vos personas et votre rituel hebdomadaire dans les paramètres, '
        '2) laissez l\'IA générer, puis validez dans le Feed, '
        '3) suivez l\'impact dans Analytics. '
        'Pour relancer cette visite, ouvrez Paramètres → Visite guidée de l\'app.',
  ),
];
