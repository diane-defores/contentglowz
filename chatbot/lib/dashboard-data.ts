import { seoApi } from './seo-api-client';

export interface DashboardData {
  authority: {
    score: number;
    previousScore?: number;
  };
  stats: {
    totalPages: number;
    pillarPages: number;
    clusterPages: number;
    issues: number;
  };
  trend: Array<{
    date: string;
    authority: number;
    target?: number;
  }>;
  gaps: Array<{
    topic: string;
    priority: 'high' | 'medium' | 'low';
    competitorCoverage: number;
    yourCoverage: number;
    potentialImpact: number;
  }>;
  recommendations: Array<{
    id: string;
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    effort: 'quick' | 'medium' | 'long';
    category: string;
  }>;
}

export async function fetchDashboardData(
  repoUrl: string
): Promise<DashboardData> {
  try {
    // Fetch mesh analysis
    const meshAnalysis = await seoApi.analyzeMesh(repoUrl);

    // Extract authority score
    const authorityScore = meshAnalysis.authority_score || 0;

    // Count pages by type
    const pillarPages = meshAnalysis.pillar ? 1 : 0;
    const clusterPages = meshAnalysis.clusters?.length || 0;
    const totalPages = meshAnalysis.total_pages || pillarPages + clusterPages;

    // Count issues
    const issues = meshAnalysis.issues?.length || 0;

    // Extract content gaps (mock for now - would need competitor analysis)
    const gaps: any[] = [];

    // Extract recommendations
    const recommendations =
      meshAnalysis.recommendations?.map((rec: any, index: number) => {
        const impact: 'high' | 'medium' | 'low' = 
          rec.priority === 'high' ? 'high' : 
          rec.priority === 'medium' ? 'medium' : 'low';
        
        const effort: 'quick' | 'medium' | 'long' = 
          rec.estimated_effort?.includes('hour') ? 'quick' : 
          rec.estimated_effort?.includes('week') ? 'medium' : 'long';
        
        return {
          id: `rec-${index}`,
          title: rec.action || rec.title || 'Recommendation',
          description: rec.description || rec.details || '',
          impact,
          effort,
          category: rec.category || 'General',
        };
      }) || [];

    // Generate trend data (mock for now - would need historical data)
    const trend = generateTrendData(authorityScore);

    return {
      authority: {
        score: authorityScore,
        previousScore: undefined, // Would need historical data
      },
      stats: {
        totalPages,
        pillarPages,
        clusterPages,
        issues,
      },
      trend,
      gaps,
      recommendations,
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
}

function generateTrendData(currentScore: number) {
  // Generate 4 months of trend data projecting towards current score
  const months = ['Jan', 'Feb', 'Mar', 'Apr'];
  const startScore = Math.max(currentScore - 15, 30);
  const increment = (currentScore - startScore) / 3;

  return months.map((month, index) => ({
    date: month,
    authority: index === 3 ? currentScore : startScore + increment * index,
    target: Math.min(currentScore + 10, 100),
  }));
}

export async function fetchRepoSummary(repoUrl: string) {
  try {
    // Get basic health check
    const health = await seoApi.healthCheck();

    // Extract repo name
    const repoName = repoUrl.split('/').pop() || 'Unknown Repo';

    return {
      repoName,
      repoUrl,
      apiStatus: health.status,
      agents: health.agents,
      lastChecked: new Date().toISOString(),
      // Placeholder data - in production this could come from cache
      basicStats: {
        totalFiles: 0,
        lastCommit: null,
        framework: 'Unknown'
      }
    };
  } catch (error) {
    console.error('Error fetching repo summary:', error);
    throw error;
  }
}

export async function fetchComparisonData(
  yourRepo: string,
  idealMainTopic: string,
  idealSubtopics: string[]
) {
  try {
    const results = await seoApi.compareMesh(yourRepo, idealMainTopic, idealSubtopics);
    return results;
  } catch (error) {
    console.error('Error fetching comparison data:', error);
    throw error;
  }
}
