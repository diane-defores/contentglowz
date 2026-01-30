import { tool } from "ai";
import { z } from "zod";
import { seoApi } from "@/lib/seo-api-client";

export const analyzeInternalLinking = tool({
	description:
		"Analyze internal linking opportunities on a website. Identifies SEO and conversion optimization opportunities.",
	inputSchema: z.object({
		url: z.string().describe("The GitHub repository URL to analyze"),
		scope: z
			.enum(["new_content_only", "include_existing", "full_site"])
			.optional()
			.describe("Scope of analysis"),
		personalizationLevel: z
			.enum(["basic", "intermediate", "advanced", "full"])
			.optional(),
		conversionFocus: z
			.number()
			.optional()
			.describe("Conversion focus weight (0-100)"),
	}),
	execute: async (input) => {
		try {
			const result = await seoApi.analyzeInternalLinking(input.url, {
				scope: input.scope,
				personalizationLevel: input.personalizationLevel,
				conversionFocus: input.conversionFocus,
			});
			return {
				success: true,
				analysisId: result.analysis_id,
				totalOpportunities: result.total_opportunities,
				seoOpportunities: result.seo_opportunities,
				conversionOpportunities: result.conversion_opportunities,
				authorityImpact: result.authority_impact,
				conversionImpact: result.conversion_impact,
				recommendedLinks: result.recommended_links,
				summary: result.summary,
				processingTime: result.processing_time_seconds,
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Failed to analyze internal linking",
			};
		}
	},
});

export const generateInternalLinkingStrategy = tool({
	description:
		"Generate a comprehensive internal linking strategy with phased implementation plan.",
	inputSchema: z.object({
		url: z.string().describe("The GitHub repository URL"),
		strategyType: z
			.enum(["balanced", "seo_focused", "conversion_focused", "custom"])
			.describe("Type of strategy to generate"),
		targetAuthority: z
			.number()
			.optional()
			.describe("Target authority score (0-100)"),
		targetConversionRate: z
			.number()
			.optional()
			.describe("Target conversion rate percentage"),
		priorityPages: z
			.array(z.string())
			.optional()
			.describe("Pages to prioritize in the strategy"),
		excludedPages: z
			.array(z.string())
			.optional()
			.describe("Pages to exclude from the strategy"),
	}),
	execute: async (input) => {
		try {
			const result = await seoApi.generateLinkingStrategy(
				input.url,
				input.strategyType,
				{
					targetAuthority: input.targetAuthority,
					targetConversionRate: input.targetConversionRate,
					priorityPages: input.priorityPages,
					excludedPages: input.excludedPages,
				},
			);
			return {
				success: true,
				strategyId: result.strategy_id,
				strategyType: result.strategy_type,
				implementationPhases: result.implementation_phases,
				resourceRequirements: result.resource_requirements,
				successMetrics: result.success_metrics,
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Failed to generate linking strategy",
			};
		}
	},
});

export const applyInternalLinks = tool({
	description: "Preview or apply internal linking recommendations to content.",
	inputSchema: z.object({
		url: z.string().describe("The GitHub repository URL"),
		links: z
			.array(
				z.object({
					source_url: z.string(),
					target_url: z.string(),
					anchor_text: z.string(),
					position: z.enum(["beginning", "middle", "end"]).optional(),
					context: z.string().optional(),
				}),
			)
			.describe("Links to apply"),
		mode: z
			.enum(["preview", "apply", "report_only"])
			.optional()
			.describe("Application mode"),
	}),
	execute: async (input) => {
		try {
			const result = await seoApi.applyInternalLinks(
				input.url,
				input.links,
				input.mode || "preview",
			);
			return {
				success: true,
				result,
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Failed to apply internal links",
			};
		}
	},
});
