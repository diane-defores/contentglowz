/**
 * Research Web Search Tools
 *
 * Provides Exa AI web search and Consensus academic search
 * tools for the research assistant.
 */
import { tool } from "ai";
import { z } from "zod";

/**
 * Creates research tools that use the provided API keys.
 */
export function createResearchTools(apiKeys: {
	exa?: string;
}) {
	const searchWeb = tool({
		description:
			"Search the web for current information using Exa AI. Use this for general research, news, blog posts, documentation, and any non-academic queries.",
		inputSchema: z.object({
			query: z.string().describe("The search query"),
			numResults: z
				.number()
				.min(1)
				.max(10)
				.default(5)
				.describe("Number of results to return (1-10)"),
			type: z
				.enum(["neural", "keyword", "auto"])
				.default("auto")
				.describe("Search type: neural (semantic), keyword (exact match), or auto"),
		}),
		execute: async ({ query, numResults, type }) => {
			const exaKey = apiKeys.exa;
			if (!exaKey) {
				return {
					error: "Exa AI API key not configured. Add it in Settings > API Keys.",
				};
			}

			try {
				const response = await fetch("https://api.exa.ai/search", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"x-api-key": exaKey,
					},
					body: JSON.stringify({
						query,
						numResults,
						type,
						useAutoprompt: true,
						contents: {
							text: { maxCharacters: 1500 },
							highlights: { numSentences: 3 },
						},
					}),
				});

				if (!response.ok) {
					const errData = await response.json().catch(() => ({}));
					return {
						error: `Exa search failed: ${errData.error || response.statusText}`,
					};
				}

				const data = await response.json();
				const results = (data.results || []).map(
					(r: {
						title?: string;
						url?: string;
						text?: string;
						highlights?: string[];
						score?: number;
						publishedDate?: string;
					}) => ({
						title: r.title || "Untitled",
						url: r.url,
						snippet:
							r.highlights?.join(" ") ||
							r.text?.slice(0, 300) ||
							"",
						score: r.score,
						publishedDate: r.publishedDate,
					}),
				);

				return { query, results, totalResults: results.length };
			} catch (err) {
				return {
					error: `Search failed: ${err instanceof Error ? err.message : "Unknown error"}`,
				};
			}
		},
	});

	const searchAcademic = tool({
		description:
			"Search for academic papers and scientific consensus. Use this for questions about scientific research, medical topics, or when peer-reviewed sources are needed.",
		inputSchema: z.object({
			query: z
				.string()
				.describe(
					"The research question or topic to search for in academic literature",
				),
		}),
		execute: async ({ query }) => {
			const exaKey = apiKeys.exa;
			if (!exaKey) {
				return {
					error: "Exa AI API key not configured. Add it in Settings > API Keys.",
				};
			}

			try {
				// Use Exa with academic domain filtering
				const response = await fetch("https://api.exa.ai/search", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"x-api-key": exaKey,
					},
					body: JSON.stringify({
						query,
						numResults: 5,
						type: "neural",
						useAutoprompt: true,
						includeDomains: [
							"scholar.google.com",
							"pubmed.ncbi.nlm.nih.gov",
							"arxiv.org",
							"nature.com",
							"science.org",
							"sciencedirect.com",
							"springer.com",
							"wiley.com",
							"ncbi.nlm.nih.gov",
							"researchgate.net",
						],
						contents: {
							text: { maxCharacters: 2000 },
							highlights: { numSentences: 3 },
						},
					}),
				});

				if (!response.ok) {
					const errData = await response.json().catch(() => ({}));
					return {
						error: `Academic search failed: ${errData.error || response.statusText}`,
					};
				}

				const data = await response.json();
				const papers = (data.results || []).map(
					(r: {
						title?: string;
						url?: string;
						text?: string;
						highlights?: string[];
						publishedDate?: string;
						author?: string;
					}) => ({
						title: r.title || "Untitled",
						url: r.url,
						abstract:
							r.highlights?.join(" ") ||
							r.text?.slice(0, 500) ||
							"",
						publishedDate: r.publishedDate,
						author: r.author,
					}),
				);

				return { query, papers, totalResults: papers.length };
			} catch (err) {
				return {
					error: `Academic search failed: ${err instanceof Error ? err.message : "Unknown error"}`,
				};
			}
		},
	});

	const fetchUrl = tool({
		description:
			"Fetch and extract the content of a specific URL. Use this when the user provides a URL to a paper, article, or webpage and wants it analyzed, summarized, or discussed.",
		inputSchema: z.object({
			url: z
				.string()
				.url()
				.describe("The URL to fetch content from"),
		}),
		execute: async ({ url }) => {
			const exaKey = apiKeys.exa;
			if (!exaKey) {
				// Fallback: basic fetch without Exa
				try {
					const response = await fetch(url, {
						headers: { "User-Agent": "ResearchBot/1.0" },
						signal: AbortSignal.timeout(10000),
					});
					if (!response.ok) {
						return { error: `Failed to fetch URL: ${response.statusText}` };
					}
					const text = await response.text();
					// Extract text content (strip HTML tags)
					const cleaned = text
						.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
						.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
						.replace(/<[^>]+>/g, " ")
						.replace(/\s+/g, " ")
						.trim()
						.slice(0, 5000);
					return { url, content: cleaned, source: "direct" };
				} catch (err) {
					return {
						error: `Failed to fetch URL: ${err instanceof Error ? err.message : "Unknown error"}`,
					};
				}
			}

			try {
				const response = await fetch("https://api.exa.ai/contents", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"x-api-key": exaKey,
					},
					body: JSON.stringify({
						urls: [url],
						text: { maxCharacters: 5000 },
						highlights: { numSentences: 5 },
					}),
				});

				if (!response.ok) {
					const errData = await response.json().catch(() => ({}));
					return {
						error: `Failed to fetch URL content: ${errData.error || response.statusText}`,
					};
				}

				const data = await response.json();
				const result = data.results?.[0];
				if (!result) {
					return { error: "No content extracted from URL" };
				}

				return {
					url,
					title: result.title || "Untitled",
					content: result.text || "",
					highlights: result.highlights || [],
					publishedDate: result.publishedDate,
					author: result.author,
					source: "exa",
				};
			} catch (err) {
				return {
					error: `Failed to fetch URL: ${err instanceof Error ? err.message : "Unknown error"}`,
				};
			}
		},
	});

	return { searchWeb, searchAcademic, fetchUrl };
}
