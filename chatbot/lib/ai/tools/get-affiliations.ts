/**
 * Get Affiliations Tool
 *
 * AI tool for fetching relevant affiliate links based on content topic.
 * Used to include affiliate links in generated content when appropriate.
 */
import { tool } from "ai";
import { z } from "zod";
import { getActiveAffiliationsByUserId } from "@/lib/db/queries";

interface GetAffiliationsContext {
	userId: string;
}

/**
 * Creates a tool instance with the user's context for fetching affiliate links.
 */
export const createGetAffiliationsTool = ({ userId }: GetAffiliationsContext) =>
	tool({
		description:
			"Get relevant affiliate links that can be included in generated content. Use this when creating content that could benefit from affiliate links. Pass keywords related to the content topic to find matching affiliate links.",
		inputSchema: z.object({
			keywords: z
				.array(z.string())
				.describe(
					"Keywords related to the content topic (e.g., ['hosting', 'wordpress', 'website'])",
				),
			category: z
				.string()
				.optional()
				.describe(
					"Optional category filter (e.g., 'tech', 'finance', 'lifestyle')",
				),
			limit: z
				.number()
				.optional()
				.default(5)
				.describe("Maximum number of affiliate links to return (default: 5)"),
		}),
		execute: async ({ keywords, category, limit }) => {
			try {
				// Fetch all active affiliate links for the user
				const affiliations = await getActiveAffiliationsByUserId({ userId });

				if (affiliations.length === 0) {
					return {
						success: true,
						affiliations: [],
						message:
							"No active affiliate links found. User can add affiliate links in the Dashboard.",
					};
				}

				// Filter by category if provided
				let filtered = affiliations;
				if (category) {
					filtered = filtered.filter(
						(a) => a.category?.toLowerCase() === category.toLowerCase(),
					);
				}

				// Score and rank affiliations by keyword relevance
				const scored = filtered.map((affiliation) => {
					let score = 0;
					const affiliationKeywords = affiliation.keywords || [];

					// Check for keyword matches
					for (const keyword of keywords) {
						const lowerKeyword = keyword.toLowerCase();

						// Check affiliate keywords
						for (const affKeyword of affiliationKeywords) {
							if (affKeyword.toLowerCase().includes(lowerKeyword)) {
								score += 2;
							} else if (lowerKeyword.includes(affKeyword.toLowerCase())) {
								score += 1;
							}
						}

						// Check name match
						if (affiliation.name.toLowerCase().includes(lowerKeyword)) {
							score += 1;
						}

						// Check notes for relevance hints
						if (affiliation.notes?.toLowerCase().includes(lowerKeyword)) {
							score += 0.5;
						}
					}

					return { affiliation, score };
				});

				// Sort by score and take top results
				const sorted = scored
					.filter((s) => s.score > 0)
					.sort((a, b) => b.score - a.score)
					.slice(0, limit);

				// If no matches, return top affiliations anyway
				const results =
					sorted.length > 0
						? sorted.map((s) => s.affiliation)
						: filtered.slice(0, limit);

				return {
					success: true,
					affiliations: results.map((a) => ({
						id: a.id,
						name: a.name,
						url: a.url,
						category: a.category,
						commission: a.commission,
						keywords: a.keywords,
						notes: a.notes,
					})),
					matchedKeywords: keywords,
					message:
						sorted.length > 0
							? `Found ${sorted.length} affiliate link(s) matching your keywords.`
							: `No exact keyword matches. Showing top ${results.length} affiliate link(s).`,
				};
			} catch (error) {
				console.error("Error fetching affiliations:", error);
				return {
					success: false,
					affiliations: [],
					error: "Failed to fetch affiliate links",
				};
			}
		},
	});
