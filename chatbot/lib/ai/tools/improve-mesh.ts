import { tool } from "ai";
import { z } from "zod";
import { seoApi } from "@/lib/seo-api-client";

export const improveMeshTool = tool({
	description:
		"Generate an improvement plan for an existing topical mesh. Analyzes gaps and suggests phased improvements.",
	inputSchema: z.object({
		url: z.string().describe("The GitHub repository URL to analyze"),
		newTopics: z
			.array(z.string())
			.optional()
			.describe("New topics to potentially add"),
		competitorTopics: z
			.array(z.string())
			.optional()
			.describe("Topics from competitors to consider"),
		targetAuthority: z
			.number()
			.optional()
			.describe("Target authority score (0-100)"),
	}),
	execute: async (input) => {
		try {
			const result = await seoApi.improveMesh(input.url, {
				newTopics: input.newTopics,
				competitorTopics: input.competitorTopics,
				targetAuthority: input.targetAuthority,
			});
			return {
				success: true,
				currentAuthority: result.current_authority,
				targetAuthority: result.target_authority,
				authorityGap: result.authority_gap,
				quickWins: result.quick_wins,
				phases: result.phases,
				totalEstimatedTime: result.total_estimated_time,
				finalProjection: result.final_projection,
				successProbability: result.success_probability,
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Failed to generate improvement plan",
			};
		}
	},
});
