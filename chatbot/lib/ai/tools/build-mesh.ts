import { tool } from "ai";
import { z } from "zod";
import { seoApi } from "@/lib/seo-api-client";

export const buildMeshTool = tool({
	description:
		"Build a new topical mesh structure from scratch for SEO content planning. Creates a pillar page with supporting cluster content.",
	inputSchema: z.object({
		mainTopic: z.string().describe("The main topic for the pillar page"),
		subtopics: z
			.array(z.string())
			.describe("List of subtopics for cluster pages"),
		businessGoals: z
			.array(z.string())
			.optional()
			.describe("Business goals like 'rank', 'convert', 'educate'"),
		targetPages: z
			.number()
			.optional()
			.describe("Target number of pages in the mesh"),
		targetAuthority: z
			.number()
			.optional()
			.describe("Target authority score (0-100)"),
	}),
	execute: async (input) => {
		try {
			const result = await seoApi.buildMesh(input.mainTopic, input.subtopics, {
				businessGoals: input.businessGoals,
				targetPages: input.targetPages,
				targetAuthority: input.targetAuthority,
			});
			return {
				success: true,
				meshId: result.mesh_id,
				mainTopic: result.main_topic,
				authorityScore: result.authority_score,
				grade: result.grade,
				totalPages: result.total_pages,
				totalLinks: result.total_links,
				meshDensity: result.mesh_density,
				pillar: result.pillar,
				clusters: result.clusters,
				linkingStrategy: result.linking_strategy,
				diagram: result.mermaid_diagram,
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Failed to build mesh",
			};
		}
	},
});
