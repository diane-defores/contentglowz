'use client';

import { useState } from 'react';
import { seoApi } from '@/lib/seo-api-client';

export interface InternalLinkingAnalysis {
  analysis_id: string;
  total_opportunities: number;
  seo_opportunities: number;
  conversion_opportunities: number;
  authority_impact: number;
  conversion_impact: number;
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

export function useInternalLinking() {
  const [analysis, setAnalysis] = useState<InternalLinkingAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeLinking = async (
    repoUrl: string,
    options?: {
      scope?: 'new_content_only' | 'include_existing' | 'full_site';
      personalizationLevel?: 'basic' | 'intermediate' | 'advanced' | 'full';
      conversionFocus?: number;
      businessObjectives?: string[];
    }
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await seoApi.analyzeInternalLinking(repoUrl, options);
      setAnalysis(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to analyze internal linking';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const generateStrategy = async (
    repoUrl: string,
    strategyType: 'balanced' | 'seo_focused' | 'conversion_focused' | 'custom',
    options?: {
      targetAuthority?: number;
      targetConversionRate?: number;
      priorityPages?: string[];
      excludedPages?: string[];
    }
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await seoApi.generateLinkingStrategy(repoUrl, strategyType, options);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate strategy';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const applyLinks = async (
    repoUrl: string,
    links: Array<{
      source_url: string;
      target_url: string;
      anchor_text: string;
      position?: 'beginning' | 'middle' | 'end';
      context?: string;
    }>,
    mode: 'preview' | 'apply' | 'report_only' = 'preview'
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await seoApi.applyInternalLinks(repoUrl, links, mode);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to apply links';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const monitorPerformance = async (
    repoUrl: string,
    timeframe: '7d' | '30d' | '90d' | 'custom' = '30d',
    customStart?: string,
    customEnd?: string
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await seoApi.monitorLinkingPerformance(repoUrl, timeframe, customStart, customEnd);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to monitor performance';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    analysis,
    loading,
    error,
    analyzeLinking,
    generateStrategy,
    applyLinks,
    monitorPerformance,
    clearError: () => setError(null),
    clearAnalysis: () => setAnalysis(null),
  };
}