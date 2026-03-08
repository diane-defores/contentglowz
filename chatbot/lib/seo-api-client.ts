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
			projectId?: string;
			strategyType?: "minimal" | "standard" | "hero+sections" | "rich";
			styleGuide?: string;
			generateResponsive?: boolean;
			pathType?: "articles" | "newsletter" | "social" | "thumbnails";
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
				project_id: options?.projectId,
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
			pathType?: "articles" | "newsletter" | "social" | "thumbnails";
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
	async getImageHistory(limit = 20, projectId?: string) {
		const params = new URLSearchParams({ limit: String(limit) });
		if (projectId) {
			params.set("project_id", projectId);
		}
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
		}>(`/api/images/history?${params.toString()}`);
	}

	/**
	 * List image generation profiles (system + custom)
	 */
	async getImageProfiles(projectId: string) {
		return this.request<{
			items: Array<{
				profile_id: string;
				name: string;
				description: string;
				image_type: "hero_image" | "section_image" | "og_card" | "thumbnail";
				image_provider: "robolly" | "openai";
				style_guide: string;
				path_type: "articles" | "newsletter" | "social" | "thumbnails";
				template_id: string | null;
				default_alt_text: string | null;
				base_prompt: string | null;
				tags: string[];
				is_system: boolean;
			}>;
			total_count: number;
		}>(`/api/images/profiles?project_id=${encodeURIComponent(projectId)}`);
	}

	/**
	 * Create or update a custom image profile
	 */
	async upsertImageProfile(params: {
		projectId: string;
		profileId: string;
		name: string;
		description?: string;
		imageType: "hero_image" | "section_image" | "og_card" | "thumbnail";
		imageProvider?: "robolly" | "openai";
		styleGuide?: string;
		pathType?: "articles" | "newsletter" | "social" | "thumbnails";
		templateId?: string | null;
		defaultAltText?: string | null;
		basePrompt?: string | null;
		tags?: string[];
	}) {
		return this.request<{
			profile_id: string;
			name: string;
			description: string;
			image_type: "hero_image" | "section_image" | "og_card" | "thumbnail";
			image_provider: "robolly" | "openai";
			style_guide: string;
			path_type: "articles" | "newsletter" | "social" | "thumbnails";
			template_id: string | null;
			default_alt_text: string | null;
			base_prompt: string | null;
			tags: string[];
			is_system: boolean;
		}>(
			`/api/images/profiles?project_id=${encodeURIComponent(params.projectId)}`,
			{
				method: "POST",
				body: JSON.stringify({
					profile_id: params.profileId,
					name: params.name,
					description: params.description || "",
					image_type: params.imageType,
					image_provider: params.imageProvider || "robolly",
					style_guide: params.styleGuide || "brand_primary",
					path_type: params.pathType || "articles",
					template_id: params.templateId ?? null,
					default_alt_text: params.defaultAltText ?? null,
					base_prompt: params.basePrompt ?? null,
					tags: params.tags || [],
				}),
			},
		);
	}

	/**
	 * Delete a custom image profile
	 */
	async deleteImageProfile(profileId: string, projectId: string) {
		return this.request<{
			success: boolean;
			profile_id: string;
		}>(
			`/api/images/profiles/${encodeURIComponent(profileId)}?project_id=${encodeURIComponent(projectId)}`,
			{
				method: "DELETE",
			},
		);
	}

	/**
	 * Generate a single image on-the-fly using a saved profile
	 */
	async generateImageFromProfile(params: {
		projectId: string;
		profileId: string;
		titleText: string;
		subtitleText?: string;
		fileName?: string;
		altText?: string;
		customPrompt?: string;
		providerOverride?: "robolly" | "openai";
		styleGuideOverride?: string;
		pathTypeOverride?: "articles" | "newsletter" | "social" | "thumbnails";
		templateIdOverride?: string;
	}) {
		return this.request<{
			success: boolean;
			profile: {
				profile_id: string;
				name: string;
				description: string;
				image_type: "hero_image" | "section_image" | "og_card" | "thumbnail";
				image_provider: "robolly" | "openai";
				style_guide: string;
				path_type: "articles" | "newsletter" | "social" | "thumbnails";
				template_id: string | null;
				default_alt_text: string | null;
				base_prompt: string | null;
				tags: string[];
				is_system: boolean;
			} | null;
			image_type: string | null;
			source_image_url: string | null;
			cdn_url: string | null;
			primary_url: string | null;
			responsive_urls: Record<string, string>;
			render_id: string | null;
			file_name: string | null;
			alt_text: string | null;
			provider_used: string | null;
			prompt_used: string | null;
			style_guide_used: string | null;
			path_type_used: string | null;
			storage_path: string | null;
			generation_time_ms: number | null;
			upload_time_ms: number | null;
			error: string | null;
		}>("/api/images/generate-from-profile", {
			method: "POST",
			body: JSON.stringify({
				project_id: params.projectId,
				profile_id: params.profileId,
				title_text: params.titleText,
				subtitle_text: params.subtitleText,
				file_name: params.fileName,
				alt_text: params.altText,
				custom_prompt: params.customPrompt,
				provider_override: params.providerOverride,
				style_guide_override: params.styleGuideOverride,
				path_type_override: params.pathTypeOverride,
				template_id_override: params.templateIdOverride,
			}),
		});
	}

	// ─────────────────────────────────────────────────
	// Reels Endpoints
	// ─────────────────────────────────────────────────

	/**
	 * Download an Instagram Reel, extract audio, upload to Bunny CDN
	 */
	async downloadReel(params: {
		url: string;
		userId: string;
		bunnyStorageKey: string;
		bunnyCdnHostname: string;
	}) {
		return this.request<{
			reel_id: string;
			video_url: string;
			audio_url: string;
			duration: number | null;
			thumbnail_url: string | null;
			caption: string | null;
			author: string | null;
		}>("/api/reels/download", {
			method: "POST",
			body: JSON.stringify({
				url: params.url,
				user_id: params.userId,
				bunny_storage_key: params.bunnyStorageKey,
				bunny_cdn_hostname: params.bunnyCdnHostname,
			}),
		});
	}

	/**
	 * Upload Instagram cookies
	 */
	async uploadReelsCookies(params: { userId: string; cookiesContent: string }) {
		return this.request<{ success: boolean }>("/api/reels/cookies", {
			method: "POST",
			body: JSON.stringify({
				user_id: params.userId,
				cookies_content: params.cookiesContent,
			}),
		});
	}

	/**
	 * Check Instagram cookie status
	 */
	async getReelsCookieStatus(userId: string) {
		return this.request<{
			has_cookies: boolean;
			username: string | null;
		}>(`/api/reels/cookies/status?user_id=${encodeURIComponent(userId)}`);
	}

	/**
	 * Delete Instagram cookies
	 */
	async deleteReelsCookies(userId: string) {
		return this.request<{ success: boolean }>("/api/reels/cookies", {
			method: "DELETE",
			body: JSON.stringify({ user_id: userId }),
		});
	}

	// ─────────────────────────────────────────────────
	// Psychology Engine Endpoints
	// ─────────────────────────────────────────────────

	/**
	 * Trigger narrative synthesis from creator entries
	 */
	async synthesizeNarrative(params: {
		profileId: string;
		entryIds: string[];
		currentVoice?: Record<string, unknown>;
		currentPositioning?: Record<string, unknown>;
		chapterTitle?: string;
	}) {
		return this.request<{ task_id: string; status: string }>(
			"/api/psychology/synthesize-narrative",
			{
				method: "POST",
				body: JSON.stringify({
					profile_id: params.profileId,
					entry_ids: params.entryIds,
					current_voice: params.currentVoice,
					current_positioning: params.currentPositioning,
					chapter_title: params.chapterTitle,
				}),
			},
		);
	}

	/**
	 * Poll for narrative synthesis status
	 */
	async getSynthesisStatus(taskId: string) {
		return this.request<{
			status: string;
			result?: {
				voice_delta: Record<string, unknown>;
				positioning_delta: Record<string, unknown>;
				narrative_summary: string;
				chapter_transition?: boolean;
				suggested_chapter_title?: string;
			};
		}>(`/api/psychology/synthesis-status/${taskId}`);
	}

	/**
	 * Trigger persona refinement with analytics data
	 */
	async refinePersona(params: {
		personaId: string;
		currentPersona: Record<string, unknown>;
		analyticsData?: Record<string, unknown>;
		contentPerformance?: Record<string, unknown>[];
	}) {
		return this.request<{ task_id: string; status: string }>(
			"/api/psychology/refine-persona",
			{
				method: "POST",
				body: JSON.stringify({
					persona_id: params.personaId,
					current_persona: params.currentPersona,
					analytics_data: params.analyticsData,
					content_performance: params.contentPerformance,
				}),
			},
		);
	}

	/**
	 * Trigger content angle generation
	 */
	async generateAngles(params: {
		profileId: string;
		personaId: string;
		creatorVoice: Record<string, unknown>;
		creatorPositioning: Record<string, unknown>;
		narrativeSummary?: string;
		personaData: Record<string, unknown>;
		contentType?: string;
		count?: number;
	}) {
		return this.request<{ task_id: string; status: string }>(
			"/api/psychology/generate-angles",
			{
				method: "POST",
				body: JSON.stringify({
					profile_id: params.profileId,
					persona_id: params.personaId,
					creator_voice: params.creatorVoice,
					creator_positioning: params.creatorPositioning,
					narrative_summary: params.narrativeSummary,
					persona_data: params.personaData,
					content_type: params.contentType,
					count: params.count || 5,
				}),
			},
		);
	}

	/**
	 * Poll for angle generation status
	 */
	async getAnglesStatus(taskId: string) {
		return this.request<{
			status: string;
			result?: {
				angles: Array<{
					title: string;
					hook: string;
					angle: string;
					content_type: string;
					narrative_thread: string;
					pain_point_addressed: string;
					confidence: number;
				}>;
				strategy_note: string;
			};
		}>(`/api/psychology/angles-status/${taskId}`);
	}

	/**
	 * Render a selected angle into multiple content formats
	 */
	async renderExtract(angleId: string, status: string) {
		return this.request<{
			angle_id: string;
			article_outline?: string;
			newsletter_hook?: string;
			social_post?: string;
			video_script_opener?: string;
		}>("/api/psychology/render-extract", {
			method: "POST",
			body: JSON.stringify({ angle_id: angleId, status }),
		});
	}
}

// Export singleton instance
export const seoApi = new SEOApiClient();

// Export class for custom instances
export { SEOApiClient };

// Export types for use in tools
export type { ApiError };
