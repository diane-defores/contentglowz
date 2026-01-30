'use client';

import { useState, useCallback } from 'react';
import { seoApi } from '@/lib/seo-api-client';

export interface InternalLinkingConfig {
  scope: 'new_content_only' | 'include_existing' | 'full_site';
  personalizationLevel: 'basic' | 'intermediate' | 'advanced' | 'full';
  conversionFocus: number;
  businessObjectives: string[];
  strategyType: 'balanced' | 'seo_focused' | 'conversion_focused' | 'custom';
  targetAuthority: number;
  targetConversionRate: number;
  priorityPages: string[];
  excludedPages: string[];
}

export interface InternalLinkingAnalysis {
  analysis_id: string;
  total_opportunities: number;
  totalOpportunities: number;
  seo_opportunities: number;
  seoOpportunities: number;
  conversion_opportunities: number;
  conversionOpportunities: number;
  authority_impact: number;
  authorityImpact: number;
  conversion_impact: number;
  conversionImpact: number;
  linking_density: number;
  linkingDensity: number;
  recommended_links: Array<{
    source_url: string;
    target_url: string;
    anchor_text: string;
    seo_score: number;
    conversion_score: number;
    confidence: number;
    category: string;
    funnel_stage: string;
    estimated_impact: number;
  }>;
  summary: {
    total_pages_analyzed: number;
    total_links_found: number;
    linking_density: number;
    authority_distribution: number;
    conversion_coverage: number;
  };
  analysis_timestamp: string;
  processing_time_seconds: number;
}

const defaultConfig: InternalLinkingConfig = {
  scope: 'include_existing',
  personalizationLevel: 'intermediate',
  conversionFocus: 50,
  businessObjectives: [],
  strategyType: 'balanced',
  targetAuthority: 50,
  targetConversionRate: 5,
  priorityPages: [],
  excludedPages: [],
};

export function useInternalLinking(repoUrl?: string, authToken?: string) {
  const [analysis, setAnalysis] = useState<InternalLinkingAnalysis | null>(null);
  const [config, setConfig] = useState<InternalLinkingConfig>(defaultConfig);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeLinking = useCallback(async (
    overrideRepoUrl?: string,
    options?: Partial<InternalLinkingConfig>
  ) => {
    const url = overrideRepoUrl || repoUrl;
    if (!url) {
      setError('No repository URL provided');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await seoApi.analyzeInternalLinking(url, {
        scope: options?.scope || config.scope,
        personalizationLevel: options?.personalizationLevel || config.personalizationLevel,
        conversionFocus: options?.conversionFocus || config.conversionFocus,
        businessObjectives: options?.businessObjectives || config.businessObjectives,
      }) as any;

      // Normalize the response to have both snake_case and camelCase
      const normalizedResult: InternalLinkingAnalysis = {
        ...result,
        totalOpportunities: result.total_opportunities || result.totalOpportunities || 0,
        seoOpportunities: result.seo_opportunities || result.seoOpportunities || 0,
        conversionOpportunities: result.conversion_opportunities || result.conversionOpportunities || 0,
        authorityImpact: result.authority_impact || result.authorityImpact || 0,
        conversionImpact: result.conversion_impact || result.conversionImpact || 0,
        linkingDensity: result.linking_density || result.linkingDensity || result.summary?.linking_density || 0,
      };

      setAnalysis(normalizedResult);
      return normalizedResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to analyze internal linking';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [repoUrl, config]);

  const generateLinkingStrategy = useCallback(async (
    overrideRepoUrl?: string,
    strategyType?: InternalLinkingConfig['strategyType'],
    options?: {
      targetAuthority?: number;
      targetConversionRate?: number;
      priorityPages?: string[];
      excludedPages?: string[];
    }
  ) => {
    const url = overrideRepoUrl || repoUrl;
    if (!url) {
      setError('No repository URL provided');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await seoApi.generateLinkingStrategy(
        url,
        strategyType || config.strategyType,
        options
      );
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate strategy';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [repoUrl, config]);

  const applyLinks = useCallback(async (
    overrideRepoUrl?: string,
    links?: Array<{
      source_url: string;
      target_url: string;
      anchor_text: string;
      position?: 'beginning' | 'middle' | 'end';
      context?: string;
    }>,
    mode: 'preview' | 'apply' | 'report_only' = 'preview'
  ) => {
    const url = overrideRepoUrl || repoUrl;
    if (!url) {
      setError('No repository URL provided');
      return null;
    }

    if (!links || links.length === 0) {
      setError('No links provided');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await seoApi.applyInternalLinks(url, links, mode);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to apply links';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [repoUrl]);

  const monitorPerformance = useCallback(async (
    overrideRepoUrl?: string,
    timeframe: '7d' | '30d' | '90d' | 'custom' = '30d',
    customStart?: string,
    customEnd?: string
  ) => {
    const url = overrideRepoUrl || repoUrl;
    if (!url) {
      setError('No repository URL provided');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await seoApi.monitorLinkingPerformance(url, timeframe, customStart, customEnd);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to monitor performance';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [repoUrl]);

  return {
    analysis,
    config,
    loading,
    error,
    setConfig,
    analyzeLinking,
    generateLinkingStrategy,
    generateStrategy: generateLinkingStrategy, // Alias for backwards compatibility
    applyLinks,
    monitorPerformance,
    clearError: () => setError(null),
    clearAnalysis: () => setAnalysis(null),
  };
}
