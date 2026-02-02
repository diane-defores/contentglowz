/**
 * API Client for SEO Robots Backend
 *
 * Connects the Next.js chatbot to the Python FastAPI backend.
 * Set SEO_API_URL env var to point to your robots server.
 * Default: localhost:8000 for local development.
 */

const API_URL =
	process.env.NEXT_PUBLIC_API_URL ||
	process.env.SEO_API_URL ||
	"http://localhost:8000";

type ApiError = {
	error: string;
	message?: string;
	details?: any;
};

class SEOApiClient {
	private readonly baseUrl: string;
	private authToken: string | undefined;

	constructor(baseUrl: string = API_URL, authToken?: string) {
		this.baseUrl = baseUrl;
		this.authToken = authToken;
	}

	/**
	 * Generic fetch wrapper with error handling
	 */
	private async request<T>(
		endpoint: string,
		options?: RequestInit,
	): Promise<T> {
		const url = `${this.baseUrl}${endpoint}`;

		try {
			console.log(`DEBUG API: Making request to ${url}`);
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 120000); // Increased to 2 minutes for cold starts

			const response = await fetch(url, {
				...options,
				mode: "cors", // Explicitly set CORS mode
				signal: controller.signal,
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
					...(this.authToken && { Authorization: `Bearer ${this.authToken}` }),
					...options?.headers,
				},
			});

			clearTimeout(timeoutId);
			console.log(`DEBUG API: Response status: ${response.status}`);

			if (!response.ok) {
				const error: ApiError = await response.json().catch(() => ({
					error: "API Error",
					message: response.statusText,
				}));
				throw new Error(error.message || error.error || "API request failed");
			}

			return await response.json();
		} catch (error) {
			if (error instanceof Error) {
				if (error.name === "AbortError") {
					console.error("DEBUG API: Request timed out after 1 minute");
					throw new Error(
						"Analysis is taking longer than expected. The repository may be large or complex. Please try again later.",
					);
				}
				console.error("DEBUG API: Request error:", error.message);
				throw error;
			}
			console.error("DEBUG API: Unknown error:", error);
			throw new Error("Unknown API error occurred");
		}
	}

	/**
	 * Check API health
	 */
	async healthCheck() {
		return this.request<{
			status: string;
			agents: Record<string, string>;
		}>("/health");
	}

	// ─────────────────────────────────────────────────
	// Topical Mesh Endpoints
	// ─────────────────────────────────────────────────

	/**
	 * Analyze existing website topical mesh
	 */
	async analyzeMesh(repoUrl: string, includeVisualization = true) {
		return this.request<{
			authority_score: number;
			grade: string;
			total_pages: number;
			total_links: number;
			mesh_density: number;
			pillar: any;
			clusters: any[];
			orphans: any[];
			issues: Array<{
				severity: string;
				category: string;
				description: string;
				affected_pages: string[];
				impact: string;
			}>;
			recommendations: Array<{
				priority: string;
				action: string;
				description: string;
				estimated_effort: string;
				estimated_impact: number;
				affected_pages: string[];
			}>;
			mermaid_diagram?: string;
			analysis_timestamp: string;
			processing_time_seconds: number;
		}>("/api/mesh/analyze", {
			method: "POST",
			body: JSON.stringify({
				repo_url: repoUrl,
				include_visualization: includeVisualization,
			}),
		});
	}

	/**
	 * Build new topical mesh from scratch
	 */
	async buildMesh(
		mainTopic: string,
		subtopics: string[],
		options?: {
			businessGoals?: string[];
			targetPages?: number;
			targetAuthority?: number;
		},
	) {
		return this.request<{
			mesh_id: string;
			main_topic: string;
			authority_score: number;
			grade: string;
			total_pages: number;
			total_links: number;
			mesh_density: number;
			pillar: any;
			clusters: any[];
			linking_strategy: any;
			mermaid_diagram?: string;
			created_at: string;
		}>("/api/mesh/build", {
			method: "POST",
			body: JSON.stringify({
				main_topic: mainTopic,
				subtopics,
				business_goals: options?.businessGoals || ["rank", "convert"],
				target_pages: options?.targetPages || 10,
				target_authority: options?.targetAuthority || 85,
			}),
		});
	}

	/**
	 * Generate improvement plan for existing mesh
	 */
	async improveMesh(
		repoUrl: string,
		options?: {
			newTopics?: string[];
			competitorTopics?: string[];
			targetAuthority?: number;
		},
	) {
		return this.request<{
			current_authority: number;
			target_authority: number;
			authority_gap: number;
			quick_wins: any[];
			phases: Array<{
				phase_number: number;
				name: string;
				description: string;
				actions: any[];
				estimated_duration: string;
				authority_gain: number;
				cumulative_authority: number;
			}>;
			total_estimated_time: string;
			final_projection: number;
			success_probability: number;
		}>("/api/mesh/improve", {
			method: "POST",
			body: JSON.stringify({
				repo_url: repoUrl,
				new_topics: options?.newTopics || [],
				competitor_topics: options?.competitorTopics || [],
				target_authority: options?.targetAuthority || 85,
			}),
		});
	}

	/**
	 * Compare current mesh with ideal structure
	 */
	async compareMesh(
		repoUrl: string,
		idealMainTopic: string,
		idealSubtopics: string[],
	) {
		return this.request<{
			current_mesh: any;
			ideal_mesh: any;
			authority_gap: number;
			missing_topics: string[];
			underperforming_pages: string[];
			gap_analysis: any;
			recommendations: any[];
		}>("/api/mesh/compare", {
			method: "POST",
			body: JSON.stringify({
				repo_url: repoUrl,
				ideal_main_topic: idealMainTopic,
				ideal_subtopics: idealSubtopics,
			}),
		});
	}

	// ─────────────────────────────────────────────────
	// Internal Linking Endpoints
	// ─────────────────────────────────────────────────

	/**
	 * Analyze internal linking opportunities
	 */
	async analyzeInternalLinking(
		repoUrl: string,
		options?: {
			scope?: "new_content_only" | "include_existing" | "full_site";
			personalizationLevel?: "basic" | "intermediate" | "advanced" | "full";
			conversionFocus?: number;
			businessObjectives?: string[];
		},
	) {
		return this.request<{
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
		}>("/api/internal-linking/analyze", {
			method: "POST",
			body: JSON.stringify({
				repo_url: repoUrl,
				scope: options?.scope || "full_site",
				personalization_level: options?.personalizationLevel || "full",
				conversion_focus: options?.conversionFocus || 70,
				business_objectives: options?.businessObjectives || [
					"leads",
					"demos",
					"sales",
				],
			}),
		});
	}

	/**
	 * Generate internal linking strategy
	 */
	async generateLinkingStrategy(
		repoUrl: string,
		strategyType: "balanced" | "seo_focused" | "conversion_focused" | "custom",
		options?: {
			targetAuthority?: number;
			targetConversionRate?: number;
			priorityPages?: string[];
			excludedPages?: string[];
		},
	) {
		return this.request<{
			strategy_id: string;
			strategy_type: string;
			target_authority: number;
			target_conversion_rate: number;
			implementation_phases: Array<{
				phase: number;
				name: string;
				description: string;
				actions: Array<{
					action_type: string;
					pages_involved: string[];
					expected_impact: number;
					effort_level: string;
					priority: string;
				}>;
				timeline: string;
				authority_gain: number;
				conversion_gain: number;
			}>;
			resource_requirements: {
				estimated_time: string;
				required_tools: string[];
				skill_level: string;
			};
			success_metrics: {
				kpis: string[];
				measurement_frequency: string;
				target_values: Record<string, number>;
			};
			created_at: string;
		}>("/api/internal-linking/strategy", {
			method: "POST",
			body: JSON.stringify({
				repo_url: repoUrl,
				strategy_type: strategyType,
				target_authority: options?.targetAuthority || 85,
				target_conversion_rate: options?.targetConversionRate || 15,
				priority_pages: options?.priorityPages || [],
				excluded_pages: options?.excludedPages || [],
			}),
		});
	}

	/**
	 * Apply internal linking recommendations
	 */
	async applyInternalLinks(
		repoUrl: string,
		links: Array<{
			source_url: string;
			target_url: string;
			anchor_text: string;
			position?: "beginning" | "middle" | "end";
			context?: string;
		}>,
		mode: "preview" | "apply" | "report_only" = "preview",
	) {
		return this.request<{
			operation_id: string;
			mode: string;
			total_links_applied: number;
			successful_links: number;
			failed_links: number;
			applied_links: Array<{
				source_url: string;
				target_url: string;
				anchor_text: string;
				status: "success" | "failed" | "skipped";
				error_message?: string;
				position_applied?: string;
				context_added?: string;
			}>;
			estimated_impact: {
				authority_gain: number;
				conversion_gain: number;
				traffic_increase: number;
				time_to_results: string;
			};
			next_steps: string[];
			report_url?: string;
			created_at: string;
		}>("/api/internal-linking/apply", {
			method: "POST",
			body: JSON.stringify({
				repo_url: repoUrl,
				links: links,
				mode: mode,
			}),
		});
	}

	/**
	 * Monitor internal linking performance
	 */
	async monitorLinkingPerformance(
		repoUrl: string,
		timeframe: "7d" | "30d" | "90d" | "custom" = "30d",
		customStart?: string,
		customEnd?: string,
	) {
		return this.request<{
			monitoring_id: string;
			timeframe: string;
			authority_trend: Array<{
				date: string;
				authority_score: number;
				linking_density: number;
				conversion_rate: number;
			}>;
			top_performing_links: Array<{
				source_url: string;
				target_url: string;
				anchor_text: string;
				clicks: number;
				conversions: number;
				conversion_rate: number;
				authority_contribution: number;
			}>;
			improvement_opportunities: Array<{
				link_id: string;
				issue_type: string;
				severity: string;
				description: string;
				recommended_fix: string;
				potential_impact: number;
			}>;
			summary: {
				total_links_monitored: number;
				active_links: number;
				conversion_rate_change: number;
				authority_score_change: number;
				roi_estimate: number;
			};
			generated_at: string;
		}>("/api/internal-linking/monitor", {
			method: "POST",
			body: JSON.stringify({
				repo_url: repoUrl,
				timeframe: timeframe,
				custom_start: customStart,
				custom_end: customEnd,
			}),
		});
	}

	// ─────────────────────────────────────────────────
	// Research & Analysis Endpoints
	// ─────────────────────────────────────────────────

	/**
	 * Analyze competitors for given keywords
	 */
	async analyzeCompetitors(
		keywords: string[],
		options?: {
			numCompetitors?: number;
			includeSerpData?: boolean;
		},
	) {
		return this.request<{
			keywords: string[];
			competitors: Array<{
				domain: string;
				url: string;
				authority_score?: number;
				backlinks?: number;
				topics_covered: string[];
				content_gaps: string[];
				strengths: string[];
				weaknesses: string[];
			}>;
			common_topics: string[];
			content_opportunities: string[];
			recommended_topics: string[];
			analysis_timestamp: string;
			processing_time_seconds: number;
		}>("/api/research/competitor-analysis", {
			method: "POST",
			body: JSON.stringify({
				keywords,
				num_competitors: options?.numCompetitors || 5,
				include_serp_data: options?.includeSerpData ?? true,
			}),
		});
	}

	// ─────────────────────────────────────────────────
	// Image Robot Endpoints
	// ─────────────────────────────────────────────────

	/**
	 * Generate images for an article
	 */
	async generateImages(
		articleContent: string,
		articleTitle: string,
		articleSlug: string,
		options?: {
			strategyType?: "minimal" | "standard" | "hero+sections" | "rich";
			styleGuide?: string;
			generateResponsive?: boolean;
			pathType?: "articles" | "newsletter" | "social";
		},
	) {
		return this.request<{
			success: boolean;
			total_images: number;
			successful_images: number;
			failed_images: number;
			images: Array<{
				success: boolean;
				image_type: string;
				primary_url: string | null;
				responsive_urls: Record<string, string>;
				alt_text: string;
				file_name: string;
				file_size_kb: number | null;
				error: string | null;
			}>;
			markdown_with_images: string;
			og_image_url: string | null;
			total_cdn_size_kb: number;
			processing_time_ms: number;
			strategy_used: string;
		}>("/api/images/generate", {
			method: "POST",
			body: JSON.stringify({
				article_content: articleContent,
				article_title: articleTitle,
				article_slug: articleSlug,
				strategy_type: options?.strategyType || "standard",
				style_guide: options?.styleGuide || "brand_primary",
				generate_responsive: options?.generateResponsive ?? true,
				path_type: options?.pathType || "articles",
			}),
		});
	}

	/**
	 * Upload a single image to CDN
	 */
	async uploadImage(
		sourceUrl: string,
		fileName: string,
		altText: string,
		options?: {
			imageType?: "hero" | "section" | "thumbnail" | "og";
			pathType?: "articles" | "newsletter" | "social";
		},
	) {
		return this.request<{
			success: boolean;
			cdn_url: string | null;
			optimizer_url: string | null;
			responsive_urls: Record<string, string>;
			file_size_kb: number | null;
			content_type: string | null;
			storage_path: string | null;
			error: string | null;
		}>("/api/images/upload", {
			method: "POST",
			body: JSON.stringify({
				source_url: sourceUrl,
				file_name: fileName,
				alt_text: altText,
				image_type: options?.imageType || "hero",
				path_type: options?.pathType || "articles",
			}),
		});
	}

	/**
	 * Check Bunny Optimizer status
	 */
	async getOptimizerStatus(testUrl?: string) {
		const params = testUrl ? `?test_url=${encodeURIComponent(testUrl)}` : "";
		return this.request<{
			enabled: boolean;
			config_enabled: boolean;
			verified: boolean | null;
			hostname: string | null;
			test_url: string | null;
			transformed_url: string | null;
			message: string;
			supported_formats: string[];
			default_quality: number;
		}>(`/api/images/optimizer/status${params}`);
	}

	/**
	 * Get image generation history
	 */
	async getImageHistory(limit = 20) {
		return this.request<{
			items: Array<{
				workflow_id: string;
				timestamp: string;
				article_title: string;
				article_slug: string;
				total_images: number;
				successful_images: number;
				failed_images: number;
				processing_time_ms: number;
				cdn_urls_count: number;
				total_cdn_size_kb: number;
			}>;
			total_count: number;
		}>(`/api/images/history?limit=${limit}`);
	}
}

// Export singleton instance
export const seoApi = new SEOApiClient();

// Export class for custom instances
export { SEOApiClient };

// Export types for use in tools
export type { ApiError };
