# Dashboard SEO - Guide d'utilisation

## 🎯 Vue d'ensemble

Le dashboard SEO fournit une vue complète de votre autorité topique, avec :
- Score d'autorité en temps réel
- Statistiques du maillage topique (pillar/cluster pages)
- Analyse des gaps de contenu vs concurrents
- Recommandations priorisées
- Graphiques de tendances

## 📍 Accès

Le dashboard est accessible à : `http://localhost:3000/dashboard`

## 🏗️ Architecture

### Composants créés

#### 1. **Components Dashboard** (`components/dashboard/`)
- `authority-score-card.tsx` - Affiche le score d'autorité avec tendance
- `mesh-stats-card.tsx` - 4 cartes de stats (total/pillar/cluster/issues)
- `authority-trend-chart.tsx` - Graphique de tendance (Recharts)
- `content-gaps-table.tsx` - Tableau des gaps vs concurrents
- `recommendations-list.tsx` - Liste d'actions prioritaires

#### 2. **Pages** (`app/dashboard/`)
- `page.tsx` - Page principale du dashboard
- `loading.tsx` - État de chargement (skeletons)

#### 3. **Data Layer** (`lib/`)
- `dashboard-data.ts` - Fonctions pour fetcher et transformer les données API

### Flux de données

```
Dashboard Page
    ↓
fetchDashboardData(repoUrl)
    ↓
seoApi.analyzeMesh() → Backend Render API
    ↓
Transform raw data → DashboardData interface
    ↓
Display components
```

## 🔌 Connexion aux données réelles

### Actuellement : Données mock
Le dashboard utilise des données mock pour démonstration.

### Pour connecter l'API :

**Option 1 : Server Component (recommandé)**
```typescript
// app/dashboard/page.tsx
import { fetchDashboardData } from '@/lib/dashboard-data';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { repo?: string };
}) {
  const repoUrl = searchParams.repo || 'https://github.com/user/default-repo';
  
  try {
    const data = await fetchDashboardData(repoUrl);
    
    return (
      <div>
        <AuthorityScoreCard {...data.authority} />
        <MeshStatsCard {...data.stats} />
        {/* ... */}
      </div>
    );
  } catch (error) {
    return <ErrorDisplay error={error} />;
  }
}
```

## 🎨 Personnalisation

### Modifier les couleurs du score
```typescript
// components/dashboard/authority-score-card.tsx
const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-600';  // Excellent
  if (score >= 60) return 'text-yellow-600'; // Bon
  if (score >= 40) return 'text-orange-600'; // Moyen
  return 'text-red-600';                     // Faible
};
```

### Ajouter un nouveau graphique
```typescript
import { BarChart, Bar, XAxis, YAxis } from 'recharts';

export function CustomChart({ data }) {
  return (
    <Card className="p-6">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <Bar dataKey="value" fill="hsl(var(--primary))" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
```

## 🔄 Actions Quick Actions

Les boutons en bas du dashboard peuvent être connectés :

```typescript
// app/dashboard/page.tsx
<Button 
  onClick={async () => {
    const result = await seoApi.analyzeMesh(newRepoUrl);
    router.refresh(); // Refresh server component
  }}
>
  Analyze New Site
</Button>
```

## 📊 Format des données

### DashboardData interface
```typescript
{
  authority: {
    score: 67.5,           // 0-100
    previousScore: 62.3    // Pour calculer la tendance
  },
  stats: {
    totalPages: 42,
    pillarPages: 8,
    clusterPages: 34,
    issues: 7
  },
  trend: [
    { date: 'Jan', authority: 55, target: 70 },
    // ...
  ],
  gaps: [
    {
      topic: 'SEO Automation',
      priority: 'high',     // high|medium|low
      competitorCoverage: 85,
      yourCoverage: 20,
      potentialImpact: 12   // Points d'autorité
    }
  ],
  recommendations: [
    {
      id: '1',
      title: 'Create pillar page',
      description: 'Details...',
      impact: 'high',       // high|medium|low
      effort: 'quick',      // quick|medium|long
      category: 'Content'
    }
  ]
}
```

## 🚀 Prochaines étapes

### Phase 1 : Connexion API ✅
- [x] Components créés
- [x] Data layer créé
- [ ] Remplacer mock data par fetchDashboardData()
- [ ] Gérer les erreurs et loading states

### Phase 2 : Interactivité
- [ ] Ajouter sélecteur de repo dans le header
- [ ] Bouton "Refresh" fonctionnel avec revalidation
- [ ] Export PDF des rapports
- [ ] Navigation vers chatbot depuis recommandations

### Phase 3 : Features avancées
- [ ] Graphe interactif du topic mesh (react-force-graph)
- [ ] Comparaison multi-sites en temps réel
- [ ] Historical tracking avec Turso
- [ ] Notifications pour les changements d'autorité

## 🔗 Intégration Chatbot

Lier dashboard et chatbot :

```typescript
// Dans recommendations-list.tsx
onActionClick={(id) => {
  router.push(`/chat?action=implement-recommendation&id=${id}`);
}}

// Dans le chatbot, détecter le paramètre et pré-remplir
// "I want to implement recommendation: Create pillar page for SEO Automation"
```

## 📦 Dépendances installées

```json
{
  "recharts": "^3.6.0",    // Graphiques
  "d3": "^7.9.0"           // Visualisations avancées (pour futur graph)
}
```

## 🐛 Troubleshooting

**Erreur : "Cannot find module '@/components/dashboard/...'"**
→ Vérifier que tsconfig.json a `"@/*": ["./*"]` dans `paths`

**Graphiques ne s'affichent pas**
→ S'assurer que le component est `'use client'` (Recharts nécessite client-side)

**Données ne se chargent pas**
→ Vérifier que `NEXT_PUBLIC_API_URL` est défini dans `.env.local`

## 📝 Testing

```bash
# Démarrer le serveur
cd chatbot
pnpm dev

# Ouvrir le dashboard
open http://localhost:3000/dashboard

# Tester avec vraies données
# 1. Modifier page.tsx pour utiliser fetchDashboardData
# 2. Passer ?repo=https://github.com/user/repo en query param
# 3. Vérifier que l'API Render répond (peut prendre 30s si cold start)
```

---

**Dashboard créé en 45 minutes** ✅  
**Ready to connect real data** 🚀
