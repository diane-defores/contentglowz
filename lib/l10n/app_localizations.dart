import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import '../core/app_language.dart';

class AppLocalizations {
  AppLocalizations(this.locale);

  final Locale locale;

  static const supportedLocales = <Locale>[
    Locale(appLanguageEnglish),
    Locale(appLanguageFrench),
  ];

  static const localizationsDelegates = <LocalizationsDelegate<dynamic>>[
    AppLocalizationsDelegate(),
    GlobalMaterialLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
  ];

  static AppLocalizations of(BuildContext context) {
    final localizations = Localizations.of<AppLocalizations>(
      context,
      AppLocalizations,
    );
    assert(localizations != null, 'AppLocalizations not found in context.');
    return localizations!;
  }

  bool get isFrench =>
      locale.languageCode.toLowerCase().startsWith(appLanguageFrench);

  String tr(
    String key, {
    Map<String, Object?> params = const <String, Object?>{},
  }) {
    final template =
        _localizedValues[isFrench
            ? appLanguageFrench
            : appLanguageEnglish]?[key] ??
        _localizedValues[appLanguageEnglish]?[key] ??
        key;

    if (params.isEmpty) {
      return template;
    }

    return template.replaceAllMapped(RegExp(r'\{([a-zA-Z0-9_]+)\}'), (match) {
      final name = match.group(1);
      if (name == null) {
        return match.group(0) ?? '';
      }
      final replacement = params[name];
      return replacement?.toString() ?? match.group(0) ?? '';
    });
  }

  static const Map<String, String> _frenchTranslations = <String, String>{
    '/day': '/jour',
    '/month': '/mois',
    '/week': '/semaine',
    '(no title)': '(sans titre)',
    'AI content ops for founders, creators, and lean teams':
        'Des opérations de contenu IA pour fondateurs, créateurs et petites équipes',
    'AI, Flutter, SaaS': 'IA, Flutter, SaaS',
    'AI generates content, you swipe to publish.':
        'L’IA génère du contenu, vous validez d’un swipe pour publier.',
    'API URL': 'URL de l’API',
    'Access denied. This view is visible only to allowlisted accounts.':
        'Accès refusé. Cette vue n’est visible que pour les comptes autorisés.',
    'Actions from robots and your work will appear here':
        'Les actions des robots et de votre travail apparaîtront ici',
    'Activity': 'Activité',
    'Affiliations': 'Affiliations',
    'All': 'Tous',
    'All ({count})': 'Tout ({count})',
    'All caught up!': 'Tout est à jour !',
    'All content passes basic audit checks':
        'Tout le contenu passe les vérifications d’audit de base',
    'All types': 'Tous les types',
    'Already signed in? Open App': 'Déjà connecté ? Ouvrir l’app',
    'Analytics': 'Analytique',
    'Analytics will appear as content flows through the pipeline':
        'Les analytics apparaîtront à mesure que le contenu avance dans le pipeline.',
    'Analyze': 'Analyser',
    'App language': 'Langue de l’application',
    'Approval Rate': 'Taux d’approbation',
    'Approve all?': 'Tout approuver ?',
    'Approve {count}': 'Approuver {count}',
    'Approved': 'Approuvé',
    'Approved {approved} items': '{approved} éléments approuvés',
    'Approved {approved}, failed {failed}':
        '{approved} approuvés, {failed} échecs',
    'Articles grouped by topic cluster':
        'Articles regroupés par cluster thématique',
    'Audio': 'Audio',
    'Audio Feedback': 'Feedback audio',
    'Audio feedback': 'Feedback audio',
    'Audio feedback sent.': 'Feedback audio envoyé.',
    'Audio message': 'Message audio',
    'Audio ready: {duration}': 'Audio prêt : {duration}',
    'Audio unavailable': 'Audio indisponible',
    'Audit': 'Audit',
    'Authentication': 'Authentification',
    'About': 'À propos',
    'Backend Connection': 'Connexion backend',
    'Blog articles': 'Articles de blog',
    'Cancel': 'Annuler',
    'Change project & content type settings':
        'Modifier le projet et les paramètres de type de contenu',
    'Channel Distribution': 'Répartition par canal',
    'Check for new content': 'Vérifier le nouveau contenu',
    'Checking...': 'Vérification...',
    'Choose how ContentFlow chooses its interface language.':
        'Choisissez comment ContentFlow sélectionne la langue de son interface.',
    'Choose the types of content the AI should generate for you, and how often.':
        'Choisissez les types de contenu que l’IA doit générer pour vous, ainsi que leur fréquence.',
    'Clear Local Clerk Session': 'Effacer la session Clerk locale',
    'Clerk is not configured': 'Clerk n’est pas configuré',
    'Common objections': 'Objections fréquentes',
    'Connect': 'Connecter',
    'Connect your project': 'Connectez votre projet',
    'Connected': 'Connecté',
    'Connecting {channelName}': 'Connexion à {channelName}',
    'Content': 'Contenu',
    'Content Angles': 'Angles de contenu',
    'Content Approval Pipeline v0.1.0':
        'Pipeline d’approbation de contenu v0.1.0',
    'Content Clusters': 'Clusters de contenu',
    'Content Engine': 'Moteur de contenu',
    'Content Feed': 'Flux de contenu',
    'Content Flows': 'Flux de contenu',
    'Content Frequency': 'Fréquence de contenu',
    'Content Tools': 'Outils de contenu',
    'Content by Type': 'Contenu par type',
    'Content generation waits for your review':
        'La génération de contenu attend votre validation',
    'Content is generated automatically':
        'Le contenu est généré automatiquement',
    'ContentFlow': 'ContentFlow',
    'Continue': 'Continuer',
    'Continue with Google': 'Continuer avec Google',
    'Create': 'Créer',
    'Copy diagnostics': 'Copier le diagnostic',
    'Copy error': 'Copier l’erreur',
    'Copy this error': 'Copier cette erreur',
    'Could not check newsletter config':
        'Impossible de vérifier la configuration newsletter',
    'Could not fetch connected accounts':
        'Impossible de récupérer les comptes connectés',
    'Could not get connect URL for {channelName}':
        'Impossible d’obtenir l’URL de connexion pour {channelName}',
    'Could not load feedback': 'Impossible de charger les feedbacks',
    'Could not load local history': 'Impossible de charger l’historique local',
    'Could not load the review queue': 'Impossible de charger la file de revue',
    'Could not open browser for {channelName} authorization':
        'Impossible d’ouvrir le navigateur pour l’autorisation {channelName}',
    'Curate ideas before generation': 'Trier les idées avant génération',
    'Delete': 'Supprimer',
    'Degraded mode diagnostics copied.':
        'Le diagnostic du mode dégradé a été copié.',
    'Degraded mode is active. Backend-dependent screens stay limited until FastAPI recovers.':
        'Le mode dégradé est actif. Les écrans dépendants du backend restent limités jusqu’au rétablissement de FastAPI.',
    'Demo workspace locked': 'Workspace démo verrouillé',
    'Diagnostics copied to clipboard.':
        'Le diagnostic a été copié dans le presse-papiers.',
    'Disconnect': 'Déconnecter',
    'Disconnect {channelName}?': 'Déconnecter {channelName} ?',
    'Disconnected {channelName}': '{channelName} déconnecté',
    'Domains': 'Domaines',
    'Edit': 'Modifier',
    'English': 'Anglais',
    'Enter a valid GitHub repository URL to continue.':
        'Entrez une URL de dépôt GitHub valide pour continuer.',
    'Enter a valid GitHub repository URL.':
        'Entrez une URL de dépôt GitHub valide.',
    'Error checking status': 'Erreur lors de la vérification du statut',
    'Error copied to clipboard.': 'L’erreur a été copiée.',
    'Failed to disconnect {channelName}':
        'Impossible de déconnecter {channelName}',
    'Failed to load activity': 'Impossible de charger l’activité',
    'Failed to load content tools':
        'Impossible de charger les outils de contenu',
    'Failed to load history': 'Impossible de charger l’historique',
    'Failed to load the calendar': 'Impossible de charger le calendrier',
    'Failed to schedule. Check backend connection.':
        'Échec de la planification. Vérifiez la connexion backend.',
    'Failed to send audio: {error}': 'Échec de l’envoi audio : {error}',
    'Failed to send: {error}': 'Échec de l’envoi : {error}',
    'Failed to update: {error}': 'Échec de mise à jour : {error}',
    'FastAPI is unavailable. ContentFlow is running in degraded mode until the backend responds again.':
        'FastAPI est indisponible. ContentFlow fonctionne en mode dégradé jusqu’à ce que le backend réponde à nouveau.',
    'Feed': 'Flux',
    'Feed your creator voice & narrative':
        'Alimenter votre voix de créateur et votre narration',
    'Feedback': 'Feedback',
    'Feedback Admin': 'Admin feedback',
    'Feedback marked as read.': 'Feedback marqué comme lu.',
    'Feedback sent.': 'Feedback envoyé.',
    'Follow system language': 'Suivre la langue du système',
    'French': 'Français',
    'Funnel': 'Tunnel',
    'Generate': 'Générer',
    'Generate & pick content angles':
        'Générer et choisir des angles de contenu',
    'Generate Newsletter': 'Générer une newsletter',
    'Generating...': 'Génération...',
    'Generation failed: {error}': 'Échec de génération : {error}',
    'General audience': 'Audience générale',
    'Get notified when new content is ready':
        'Recevoir une alerte quand du nouveau contenu est prêt',
    'GitHub URL': 'URL GitHub',
    'History': 'Historique',
    'How much content should the AI generate?':
        'Combien de contenu l’IA doit-elle générer ?',
    'How the workflow actually works':
        'Comment le workflow fonctionne réellement',
    'Here is the fixed demo workspace that will be served to every demo user.':
        'Voici le workspace démo fixe qui sera servi à chaque utilisateur démo.',
    'Here\'s your content plan. You can change it anytime in Settings.':
        'Voici votre plan de contenu. Vous pouvez le modifier à tout moment dans Réglages.',
    'Idea Pool': 'Réservoir d’idées',
    'Ideas from newsletters, SEO, competitors and social listening will be held for your review before articles are generated.':
        'Les idées issues des newsletters, du SEO, des concurrents et de l’écoute sociale seront conservées pour votre validation avant la génération des articles.',
    'Issues': 'Problèmes',
    'Issues Found': 'Problèmes détectés',
    'Job ID: {jobId}': 'ID du job : {jobId}',
    'Job started': 'Job démarré',
    'Language': 'Langue',
    'Link your GitHub repository so the AI can analyze your codebase and generate relevant content.':
        'Liez votre dépôt GitHub afin que l’IA puisse analyser votre codebase et générer du contenu pertinent.',
    'Loading Idea Pool settings': 'Chargement des réglages Idea Pool',
    'Loading connected accounts...': 'Chargement des comptes connectés...',
    'Loading notification preferences':
        'Chargement des préférences de notification',
    'Local Clerk session cleared. Try signing in again.':
        'La session Clerk locale a été effacée. Réessayez de vous connecter.',
    'Manage customer personas': 'Gérer les personas clients',
    'Mark as read': 'Marquer comme lu',
    'Message is empty.': 'Le message est vide.',
    'Microphone access denied.': 'Accès micro refusé.',
    'More': 'Plus',
    'My Tech Blog': 'Mon blog tech',
    'No repo linked': 'Aucun dépôt lié',
    'Name and topics are required': 'Le nom et les sujets sont requis',
    'Newsletter': 'Newsletter',
    'Newsletter agent configured': 'Agent newsletter configuré',
    'Newsletter agent not fully configured':
        'Agent newsletter pas complètement configuré',
    'Newsletter name': 'Nom de la newsletter',
    'Newsletters': 'Newsletters',
    'Next steps': 'Prochaines étapes',
    'No activity yet': 'Aucune activité pour le moment',
    'No audio URL provided by backend.':
        'Aucune URL audio fournie par le backend.',
    'No audio ready to send.': 'Aucun audio prêt à envoyer.',
    'No audio recorded.': 'Aucun audio enregistré.',
    'No connected account found': 'Aucun compte connecté trouvé',
    'No content data for funnel analysis':
        'Aucune donnée de contenu pour l’analyse du tunnel',
    'No content data yet': 'Aucune donnée de contenu pour le moment',
    'No content to audit': 'Aucun contenu à auditer',
    'No content waiting for review': 'Aucun contenu en attente de validation',
    'No data yet': 'Aucune donnée pour le moment',
    'No destination data available': 'Aucune donnée de destination disponible',
    'No feedback for this filter.': 'Aucun feedback pour ce filtre.',
    'No feedback sent recently from this device.':
        'Aucun feedback envoyé récemment depuis cet appareil.',
    'No history yet': 'Aucun historique pour le moment',
    'No pending validations': 'Aucune validation en attente',
    'No published content yet': 'Aucun contenu publié pour le moment',
    'Not wired': 'Non câblé',
    'Not wired to LATE publish flow yet':
        'Pas encore branché au flux de publication LATE',
    'Nothing scheduled yet': 'Rien n’est encore planifié',
    'Notification preferences unavailable':
        'Préférences de notification indisponibles',
    'Notifications': 'Notifications',
    'Off': 'Off',
    'Offline (using mock data)': 'Hors ligne (données simulées)',
    'Onboarding': 'Onboarding',
    'Open App Entry': 'Ouvrir l’entrée de l’app',
    'Open Demo Workspace': 'Ouvrir le workspace démo',
    'Open Interactive Demo': 'Ouvrir la démo interactive',
    'Open Uptime': 'Ouvrir Uptime',
    'Pause': 'Pause',
    'Pending': 'En attente',
    'Pending Review': 'En attente de revue',
    'Perf': 'Perf',
    'Performance': 'Performance',
    'Personas': 'Personas',
    'Pipeline Funnel': 'Tunnel du pipeline',
    'Play': 'Lire',
    'Please wait': 'Veuillez patienter',
    'Professional': 'Professionnel',
    'Casual': 'Décontracté',
    'Inspirational': 'Inspirant',
    'Project': 'Projet',
    'Project name': 'Nom du projet',
    'Push notifications': 'Notifications push',
    'Publish': 'Publier',
    'Publish Destinations': 'Destinations de publication',
    'Published': 'Publié',
    'Publishing Channels': 'Canaux de publication',
    'Publishing Timeline': 'Chronologie de publication',
    'Read': 'Lu',
    'Ready to Schedule': 'Prêt à planifier',
    'Ready to go!': 'Prêt à démarrer !',
    'Recent feedback sent': 'Derniers feedbacks envoyés',
    'Recent review actors': 'Derniers réviseurs',
    'Recently Published': 'Publié récemment',
    'Record': 'Enregistrer',
    'Record a short voice message, then send it.':
        'Enregistrez un court message vocal, puis envoyez-le.',
    'Recording in progress: {duration}': 'Enregistrement en cours : {duration}',
    'Refresh': 'Rafraîchir',
    'Rejected': 'Rejeté',
    'Research': 'Recherche',
    'Retry': 'Réessayer',
    'Review Demo Setup': 'Relire la config démo',
    'Review incoming user feedback': 'Examiner les feedbacks utilisateurs',
    'Repo-aware onboarding instead of blank-prompt setup':
        'Onboarding relié au dépôt plutôt qu’une configuration vide à base de prompts',
    'Narrative ritual plus personas before generation':
        'Rituel narratif et personas avant la génération',
    'Swipe approval flow tied to real publish actions':
        'Flux d’approbation par swipe relié à de vraies actions de publication',
    'Demo workspace available without sales call':
        'Workspace démo disponible sans appel commercial',
    'You explain your product from scratch in every prompt.':
        'Vous réexpliquez votre produit depuis zéro dans chaque prompt.',
    'Ideas, drafts, and publishing live in separate tools.':
        'Les idées, brouillons et publications vivent dans des outils séparés.',
    'The team loses momentum between generation and approval.':
        'L’équipe perd de l’élan entre la génération et l’approbation.',
    'Publishing still depends on manual copy-paste.':
        'La publication dépend encore de copier-coller manuels.',
    'Your workspace starts from a real repo and a real content plan.':
        'Votre workspace démarre à partir d’un vrai dépôt et d’un vrai plan de contenu.',
    'Rituals and personas sharpen the angle before generation.':
        'Les rituels et personas affinent l’angle avant génération.',
    'Drafts are reviewed with one approval workflow.':
        'Les brouillons sont relus dans un seul workflow d’approbation.',
    'Publishing, scheduling, and channel readiness stay visible.':
        'La publication, la planification et l’état des canaux restent visibles.',
    '1. Connect the product context': '1. Connectez le contexte produit',
    '2. Shape the narrative': '2. Structurez la narration',
    '3. Review and publish': '3. Relisez et publiez',
    'The promise is not "AI writes for you". The promise is a tighter system from source material to published output.':
        'La promesse n’est pas « l’IA écrit pour vous ». La promesse est un système plus serré entre la matière source et la publication.',
    'Onboarding that creates a plan': 'Onboarding qui crée un plan',
    'Project, repo, formats, and cadence are captured before generation starts.':
        'Le projet, le dépôt, les formats et la cadence sont capturés avant le démarrage de la génération.',
    'The app uses ritual and persona inputs to propose more relevant content directions.':
        'L’app utilise les rituels et les personas pour proposer des directions de contenu plus pertinentes.',
    'Operators can swipe through content decisions quickly instead of managing a cluttered queue.':
        'Les opérateurs peuvent swiper rapidement les décisions de contenu au lieu de gérer une file encombrée.',
    'Publishing visibility': 'Visibilité de publication',
    'Why not just use ChatGPT?':
        'Pourquoi ne pas simplement utiliser ChatGPT ?',
    'What makes the demo useful?': 'Qu’est-ce qui rend la démo utile ?',
    'The demo is a stable public workspace, so visitors can inspect the workflow end-to-end before creating their own workspace.':
        'La démo est un workspace public stable, ce qui permet aux visiteurs d’inspecter le workflow de bout en bout avant de créer le leur.',
    'Is this only for social posts?':
        'Est-ce uniquement pour les posts sociaux ?',
    'No. The product already models blog posts, newsletters, social posts, video scripts, and short-form video content.':
        'Non. Le produit modélise déjà les articles de blog, newsletters, posts sociaux, scripts vidéo et contenus vidéo courts.',
    'Start with the stable demo workspace to inspect the flow, then create your own workspace when you are ready to connect a real product.':
        'Commencez avec le workspace démo stable pour inspecter le flux, puis créez votre propre workspace quand vous serez prêt à connecter un vrai produit.',
    'Continue Onboarding': 'Continuer l’onboarding',
    'Setup required': 'Configuration requise',
    'Session active': 'Session active',
    'Session error': 'Erreur de session',
    'Sign in to access your workspace':
        'Connectez-vous pour accéder à votre workspace',
    'Reviewed': 'Relu',
    'Reviewed by {reviewer}{typeSuffix}': 'Relu par {reviewer}{typeSuffix}',
    'Reviewer: {reviewer}': 'Reviewer : {reviewer}',
    'Runs': 'Exécutions',
    'SEO': 'SEO',
    'SKIP': 'PASSER',
    'Schedule': 'Planning',
    'Scheduled "{title}" for {date}': '« {title} » planifié pour le {date}',
    'See the workflow before you commit': 'Voir le workflow avant de s’engager',
    'Send': 'Envoyer',
    'Send Feedback': 'Envoyer un feedback',
    'Send product feedback directly from the app. Text and audio feedback are sent to the backend and stay anonymous when no account is connected.':
        'Envoyez un retour produit directement depuis l’app. Les feedbacks texte et audio sont transmis au backend et restent anonymes si aucun compte n’est connecté.',
    'Sending...': 'Envoi...',
    'Sent anonymously': 'Envoyé anonymement',
    'Sent with {account}': 'Envoyé avec {account}',
    'Settings': 'Réglages',
    'Setup': 'Configuration',
    'Share Feedback': 'Partager un feedback',
    'Share text or audio product feedback':
        'Partager un retour produit texte ou audio',
    'Shorts': 'Formats courts',
    'Sign In': 'Se connecter',
    'Sign in to configure Idea Pool':
        'Connectez-vous pour configurer Idea Pool',
    'Sign in to configure content frequency':
        'Connectez-vous pour configurer la fréquence de contenu',
    'Sign in to sync notification preferences':
        'Connectez-vous pour synchroniser les préférences de notification',
    'Sign in with Google': 'Se connecter avec Google',
    'Sign in with Google before creating a workspace.':
        'Connectez-vous avec Google avant de créer un workspace.',
    'Sign out': 'Se déconnecter',
    'Skip': 'Passer',
    'Skipped: {title}': 'Passé : {title}',
    'Social posts': 'Posts réseaux sociaux',
    'Something went wrong': 'Un problème est survenu',
    'Start': 'Démarrer',
    'Status: {status}': 'Statut : {status}',
    'Stop': 'Arrêter',
    'System': 'Système',
    'Target audience': 'Audience cible',
    'Technical': 'Technique',
    'Templates': 'Modèles',
    'Text': 'Texte',
    'Text Feedback': 'Feedback texte',
    'Text message': 'Message texte',
    'This onboarding uses a fixed public repo and pre-generated content. Users can explore the flow, but the demo data is intentionally read-only.':
        'Cet onboarding utilise un dépôt public fixe et un contenu pré-généré. Les utilisateurs peuvent explorer le flux, mais les données de démo sont volontairement en lecture seule.',
    'Timeline': 'Chronologie',
    'Tone': 'Ton',
    'Tools': 'Outils',
    'Topics (comma-separated)': 'Sujets (séparés par des virgules)',
    'Total': 'Total',
    'Total Reviewed': 'Total revu',
    'Turn one repo into a weekly content machine.':
        'Transformez un seul dépôt en machine à contenu hebdomadaire.',
    'Uptime': 'Disponibilité',
    'Uploading...': 'Upload...',
    'Use the web sign-in flow': 'Utiliser le flux de connexion web',
    'User feedback received by the backend. Real access control still lives server-side.':
        'Retours utilisateurs reçus par le backend. Le contrôle d’accès réel reste côté serveur.',
    'Validations': 'Validations',
    'Video scripts': 'Scripts vidéo',
    'View Idea Pool': 'Voir Idea Pool',
    'Weekly Ritual': 'Rituel hebdomadaire',
    'What content do you want?': 'Quel contenu voulez-vous ?',
    'What is blocking you, missing, or could be improved?':
        'Qu’est-ce qui vous bloque, manque, ou pourrait être amélioré ?',
    'With ContentFlow': 'Avec ContentFlow',
    'Without ContentFlow': 'Sans ContentFlow',
    'approved': 'approuvé',
    'completed': 'terminé',
    'editing': 'édition',
    'failed': 'échec',
    'pending': 'en attente',
    'published': 'publié',
    'rejected': 'rejeté',
    'running': 'en cours',
    'started': 'démarré',
    'your account': 'votre compte',
    'anonymous': 'anonyme',
    'no date': 'sans date',
    'queued': 'en file',
    'unknown': 'inconnu',
    '{channelName} is not supported for direct connection yet':
        '{channelName} n’est pas encore pris en charge pour une connexion directe',
    '{count} articles awaiting validation':
        '{count} articles en attente de validation',
    '{count} contents/week': '{count} contenus/semaine',
    '{total} total · {published} published':
        '{total} au total · {published} publiés',
    'Access State': 'Etat d acces',
    'Action failed: {error}': 'Echec de l action : {error}',
    'Analyze your site against competitors':
        'Analysez votre site face a vos concurrents',
    'Analyzing...': 'Analyse en cours...',
    'Analysis Results': 'Resultats de l analyse',
    'Analysis failed: {error}': 'Echec de l analyse : {error}',
    'API Details': 'Details de l API',
    'API Online': 'API en ligne',
    'API Offline': 'API hors ligne',
    'Articles': 'Articles',
    'Articles/day': 'Articles/jour',
    'Absolute path to the Markdown files':
        'Chemin absolu vers les fichiers Markdown',
    'Audit Trail': 'Trace d audit',
    'Audit trail copied': 'Trace d audit copiee',
    'Audit trail unavailable: {error}':
        'Trace d audit indisponible : {error}',
    'Auto (AI detects semantic cocoons)':
        'Auto (l IA detecte les cocons semantiques)',
    'Backend status check failed': 'La verification du statut backend a echoue',
    'Body edits': 'Modifications du contenu',
    'Back': 'Retour',
    'Both': 'Les deux',
    'By directory structure': 'Par structure de dossiers',
    'By frontmatter tags': 'Par tags de frontmatter',
    'Cadence': 'Cadence',
    'Cancel plan': 'Annuler le plan',
    'Cancel Plan': 'Annuler le plan',
    'Cluster Items': 'Grouper les contenus',
    'Clustered into {count} groups': '{count} groupes crees',
    'Clusters': 'Clusters',
    'Clustering': 'Clustering',
    'Clustering Strategy': 'Strategie de clustering',
    'Comment': 'Commenter',
    'Competitor Analysis': 'Analyse concurrentielle',
    'Competitor URLs (one per line)': 'URLs concurrentes (une par ligne)',
    'Configuration': 'Configuration',
    'Content body...': 'Corps du contenu...',
    'Content directory': 'Dossier de contenu',
    'Content Drip': 'Publication progressive',
    'Content not found': 'Contenu introuvable',
    'ContentFlow system status diagnostics':
        'Diagnostic de l etat systeme de ContentFlow',
    'Could not load full content: {error}':
        'Impossible de charger le contenu complet : {error}',
    'Could not open the editor': 'Impossible d ouvrir l editeur',
    'Could not save changes: {error}':
        'Impossible d enregistrer les modifications : {error}',
    'Copy audit trail': 'Copier la trace d audit',
    'Create a plan to progressively publish your content.\nGoogle will see a natural publishing rhythm.':
        'Creez un plan pour publier progressivement votre contenu.\nGoogle verra un rythme de publication naturel.',
    'Create drip plan': 'Creer un plan progressif',
    'Create Plan': 'Creer le plan',
    'Delete plan': 'Supprimer le plan',
    'Discard': 'Ignorer',
    'Discard changes?': 'Ignorer les modifications ?',
    'Domains are created when robots run on a project':
        'Les domaines sont crees quand des robots tournent sur un projet',
    'Done': 'Fait',
    'Drip plan created! Import content to get started.':
        'Plan progressif cree. Importez du contenu pour commencer.',
    'Draft flag': 'Drapeau brouillon',
    'Each folder becomes a cluster. index.md = pillar.':
        'Chaque dossier devient un cluster. index.md = pilier.',
    'Enabled': 'Active',
    'Error': 'Erreur',
    'Error: {error}': 'Erreur : {error}',
    'Execute Drip Now': 'Executer la publication maintenant',
    'Failed to load drip plan': 'Impossible de charger le plan progressif',
    'Failed to load drip plans': 'Impossible de charger les plans progressifs',
    'Failed to load runs': 'Impossible de charger les executions',
    'Failed to load work domains':
        'Impossible de charger les domaines de travail',
    'First tag = cluster. Most tags = pillar.':
        'Premier tag = cluster. Le plus de tags = pilier.',
    'Fixed': 'Fixe',
    'Framework': 'Framework',
    'Future pubDate (recommended)': 'pubDate future (recommande)',
    'GSC': 'GSC',
    'Gating': 'Controle',
    'Gating method': 'Methode de controle',
    'Generate Schedule': 'Generer le planning',
    'Ghost': 'Ghost',
    'GitHub Actions': 'GitHub Actions',
    'GitHub repo': 'Depot GitHub',
    'HH:MM': 'HH:MM',
    'Import Content': 'Importer le contenu',
    'Imported {count} articles': '{count} articles importes',
    'Instagram': 'Instagram',
    'Keep editing': 'Continuer a modifier',
    'Keywords (comma-separated, optional)':
        'Mots-cles (separes par des virgules, optionnel)',
    'Last': 'Dernier',
    'Last backend message: {message}': 'Dernier message backend : {message}',
    'Last drip': 'Derniere publication',
    'Like': 'J aime',
    'Loading...': 'Chargement...',
    'Loading audit trail...': 'Chargement de la trace d audit...',
    'Manual': 'Manuel',
    'Name & Source': 'Nom et source',
    'Mon': 'Lun',
    'Tue': 'Mar',
    'Wed': 'Mer',
    'Thu': 'Jeu',
    'Fri': 'Ven',
    'Sat': 'Sam',
    'Sun': 'Dim',
    'New Drip Plan — Step {step}/4': 'Nouveau plan progressif — Etape {step}/4',
    'Next': 'Suivant',
    'Next drip': 'Prochaine publication',
    'Next drip: {date}': 'Prochaine publication : {date}',
    'No audit events yet.': 'Aucun evenement d audit pour le moment.',
    'No competitor data returned.': 'Aucune donnee concurrentielle retournee.',
    'No clustering (alphabetical)': 'Aucun clustering (alphabetique)',
    'No drip plans yet': 'Aucun plan progressif pour le moment',
    'No robot runs yet': 'Aucune execution robot pour le moment',
    'No work domains configured': 'Aucun domaine de travail configure',
    'Offline': 'Hors ligne',
    'Online': 'En ligne',
    'Ping again': 'Relancer le ping',
    'Ping History': 'Historique des pings',
    'Plan activated — dripping starts!':
        'Plan active : la publication progressive commence !',
    'Plan cancelled': 'Plan annule',
    'Plan deleted': 'Plan supprime',
    'Plan name': 'Nom du plan',
    'Plan paused': 'Plan en pause',
    'Plan resumed': 'Plan repris',
    'Platform preview': 'Apercu plateforme',
    'Platform Previews': 'Apercus des plateformes',
    'Progress': 'Progression',
    'Publish days': 'Jours de publication',
    'Publish pillar before spokes': 'Publier le pilier avant les satellites',
    'Publish time': 'Heure de publication',
    'Published {count} articles': '{count} articles publies',
    'Published {published}/{total} ({percent}%)':
        '{published}/{total} publies ({percent}%)',
    'Ramp up': 'Montee en charge',
    'Rebuild': 'Rebuild',
    'Rebuild method': 'Methode de rebuild',
    'Repost': 'Republier',
    'Resume': 'Reprendre',
    'Retry backend': 'Relancer le backend',
    'Robot Runs': 'Executions des robots',
    'SSG Framework': 'Framework SSG',
    'Save & Publish': 'Enregistrer et publier',
    'Scheduled {count} items': '{count} elements planifies',
    'Site URL and at least one competitor are required':
        'L URL du site et au moins un concurrent sont requis',
    'Start date': 'Date de debut',
    'Status transitions': 'Transitions de statut',
    'Strengths: {list}': 'Forces : {list}',
    'Title': 'Titre',
    'Topical Mesh Architect detects pillars & spokes.':
        'Topical Mesh Architect detecte les piliers et satellites.',
    'Twitter / X': 'Twitter / X',
    'Unknown': 'Inconnu',
    'Unknown action': 'Action inconnue',
    'Weaknesses: {list}': 'Faiblesses : {list}',
    'Webhook (Vercel/Netlify)': 'Webhook (Vercel/Netlify)',
    'Webhook URL': 'URL du webhook',
    'Work Domains': 'Domaines de travail',
    'WordPress': 'WordPress',
    'YYYY-MM-DD': 'AAAA-MM-JJ',
    'You have unsaved edits.': 'Vous avez des modifications non enregistrees.',
    'YouTube': 'YouTube',
    'Your Headline': 'Votre accroche',
    'Your Name': 'Votre nom',
    'Your site URL': 'URL de votre site',
    'active': 'actif',
    'articles': 'articles',
    'auto': 'auto',
    'cancelled': 'annule',
    'day': 'jour',
    'directory': 'dossier',
    'draft': 'brouillon',
    'edits': 'modifications',
    'future_date': 'date future',
    'github_actions': 'github actions',
    'loading': 'chargement',
    'manual': 'manuel',
    'none': 'aucun',
    'owner/repo': 'owner/repo',
    'paused': 'en pause',
    'success': 'succes',
    'tags': 'tags',
    'transitions': 'transitions',
    'webhook': 'webhook',
    'yourhandle': 'votrecompte',
  };

  static const Map<String, Map<String, String>> _localizedValues =
      <String, Map<String, String>>{appLanguageFrench: _frenchTranslations};
}

class AppLocalizationsDelegate extends LocalizationsDelegate<AppLocalizations> {
  const AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) {
    final languageCode = locale.languageCode.toLowerCase();
    return languageCode.startsWith(appLanguageEnglish) ||
        languageCode.startsWith(appLanguageFrench);
  }

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(AppLocalizations(locale));
  }

  @override
  bool shouldReload(AppLocalizationsDelegate old) => false;
}

extension AppLocalizationsBuildContextX on BuildContext {
  AppLocalizations get l10n => AppLocalizations.of(this);

  String get localeTag => Localizations.localeOf(this).toLanguageTag();

  String tr(
    String key, [
    Map<String, Object?> params = const <String, Object?>{},
  ]) {
    return l10n.tr(key, params: params);
  }
}
