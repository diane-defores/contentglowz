import { tool } from "ai";
import { z } from "zod";
import { seoApi } from "@/lib/seo-api-client";

export const analyzeMeshTool = tool({
	description:
		"Analyze the topical mesh structure of a website for SEO optimization. Returns authority score, page structure, issues, and recommendations.",
	inputSchema: z.object({
		url: z
			.string()
			.describe(
				"The GitHub repository URL to analyze (e.g., https://github.com/user/repo)",
			),
		includeVisualization: z
			.boolean()
			.optional()
			.describe("Whether to include a Mermaid diagram visualization"),
	}),
	execute: async (input) => {
		try {
			const result = await seoApi.analyzeMesh(
				input.url,
				input.includeVisualization ?? true,
			);
			return {
				success: true,
				authorityScore: result.authority_score,
				grade: result.grade,
				totalPages: result.total_pages,
				totalLinks: result.total_links,
				meshDensity: result.mesh_density,
				pillar: result.pillar,
				clusters: result.clusters,
				orphans: result.orphans,
				issues: result.issues,
				recommendations: result.recommendations,
				diagram: result.mermaid_diagram,
				processingTime: result.processing_time_seconds,
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "Failed to analyze mesh",
			};
		}
	},
});
