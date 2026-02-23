/**
 * Research Web Search Tools
 *
 * Provider-aware search tools for the research assistant.
 * Supports: Exa AI (default), Consensus (academic), Tavily (web).
 */
import { tool } from "ai";
import { z } from "zod";

interface ResearchToolsConfig {
	exa?: string;
	consensus?: string;
	tavily?: string;
	providerId?: string;
}

/**
 * Creates research tools based on the selected provider.
 */
export function createResearchTools(config: ResearchToolsConfig) {
	const { providerId = "exa" } = config;

	if (providerId === "tavily") {
		return createTavilyTools(config);
	}
	if (providerId === "consensus") {
		return createConsensusTools(config);
	}
	return createExaTools(config);
}

// ─── Exa AI Tools ───────────────────────────────────────────────────────────

function createExaTools(config: ResearchToolsConfig) {
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
				.describe(
					"Search type: neural (semantic), keyword (exact match), or auto",
				),
		}),
		execute: async ({ query, numResults, type }) => {
			const exaKey = config.exa;
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
							r.highlights?.join(" ") || r.text?.slice(0, 300) || "",
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
			"Search for academic papers and scientific research. Use this for questions about scientific research, medical topics, or when peer-reviewed sources are needed.",
		inputSchema: z.object({
			query: z
				.string()
				.describe(
					"The research question or topic to search for in academic literature",
				),
		}),
		execute: async ({ query }) => {
			const exaKey = config.exa;
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
							r.highlights?.join(" ") || r.text?.slice(0, 500) || "",
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

	const fetchUrl = createFetchUrlTool(config);

	return { searchWeb, searchAcademic, fetchUrl };
}

// ─── Consensus Tools ────────────────────────────────────────────────────────

function createConsensusTools(config: ResearchToolsConfig) {
	const searchWeb = tool({
		description:
			"Search the web for current information. Use this for general research, news, blog posts, documentation, and any non-academic queries. Falls back to Exa AI if available.",
		inputSchema: z.object({
			query: z.string().describe("The search query"),
			numResults: z
				.number()
				.min(1)
				.max(10)
				.default(5)
				.describe("Number of results to return (1-10)"),
		}),
		execute: async ({ query, numResults }) => {
			// Consensus is academic-only, so web search falls back to Exa
			const exaKey = config.exa;
			if (!exaKey) {
				return {
					error: "Exa AI API key needed for web search. Consensus only supports academic search.",
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
						type: "auto",
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
						error: `Web search failed: ${errData.error || response.statusText}`,
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
							r.highlights?.join(" ") || r.text?.slice(0, 300) || "",
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
			"Search for scientific consensus and peer-reviewed evidence using the Consensus API. Prioritizes systematic reviews, meta-analyses, and high-quality evidence. ALWAYS use this tool for scientific, medical, or health-related questions.",
		inputSchema: z.object({
			query: z
				.string()
				.describe("The research question to find scientific consensus on"),
			yearMin: z
				.number()
				.optional()
				.describe("Exclude papers published before this year"),
			studyTypes: z
				.array(
					z.enum([
						"case report",
						"literature review",
						"meta-analysis",
						"rct",
						"systematic review",
					]),
				)
				.optional()
				.describe(
					"Filter by study type (e.g. meta-analysis, rct, systematic review)",
				),
			excludePreprints: z
				.boolean()
				.default(true)
				.describe("Only include peer-reviewed papers"),
		}),
		execute: async ({ query, yearMin, studyTypes, excludePreprints }) => {
			const consensusKey = config.consensus;
			if (!consensusKey) {
				return {
					error: "Consensus API key not configured. Add it in Settings > API Keys.",
				};
			}

			try {
				const params = new URLSearchParams({ query });
				if (yearMin) params.set("year_min", String(yearMin));
				if (studyTypes?.length)
					params.set("study_types", studyTypes.join(","));
				if (excludePreprints)
					params.set("exclude_preprints", "true");

				const response = await fetch(
					`https://api.consensus.app/v1/quick_search?${params}`,
					{
						headers: {
							"x-api-key": consensusKey,
						},
					},
				);

				if (!response.ok) {
					const errData = await response.json().catch(() => ({}));
					return {
						error: `Consensus search failed: ${errData.error || response.statusText}`,
					};
				}

				const data = await response.json();
				const papers = (data.results || []).map(
					(r: {
						title?: string;
						abstract?: string;
						authors?: string[];
						doi?: string;
						journal_name?: string;
						publish_year?: number;
						url?: string;
						citation_count?: number;
						study_type?: string;
						takeaway?: string;
					}) => ({
						title: r.title || "Untitled",
						url: r.url || (r.doi ? `https://doi.org/${r.doi}` : undefined),
						abstract: r.abstract?.slice(0, 500) || "",
						authors: r.authors?.slice(0, 3).join(", "),
						journal: r.journal_name,
						year: r.publish_year,
						citations: r.citation_count,
						studyType: r.study_type,
						takeaway: r.takeaway,
					}),
				);

				return { query, papers, totalResults: papers.length };
			} catch (err) {
				return {
					error: `Consensus search failed: ${err instanceof Error ? err.message : "Unknown error"}`,
				};
			}
		},
	});

	const fetchUrl = createFetchUrlTool(config);

	return { searchWeb, searchAcademic, fetchUrl };
}

// ─── Tavily Tools ───────────────────────────────────────────────────────────

function createTavilyTools(config: ResearchToolsConfig) {
	const searchWeb = tool({
		description:
			"Search the web for current information using Tavily. Use this for general research, news, blog posts, documentation, and any queries requiring up-to-date information.",
		inputSchema: z.object({
			query: z.string().describe("The search query"),
			numResults: z
				.number()
				.min(1)
				.max(10)
				.default(5)
				.describe("Number of results to return (1-10)"),
			searchDepth: z
				.enum(["basic", "advanced"])
				.default("basic")
				.describe("Search depth: basic (fast) or advanced (more relevant)"),
			topic: z
				.enum(["general", "news", "finance"])
				.default("general")
				.describe("Topic category to optimize results"),
		}),
		execute: async ({ query, numResults, searchDepth, topic }) => {
			const tavilyKey = config.tavily;
			if (!tavilyKey) {
				return {
					error: "Tavily API key not configured. Add it in Settings > API Keys.",
				};
			}

			try {
				const response = await fetch("https://api.tavily.com/search", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${tavilyKey}`,
					},
					body: JSON.stringify({
						query,
						max_results: numResults,
						search_depth: searchDepth,
						topic,
						include_answer: true,
					}),
				});

				if (!response.ok) {
					const errData = await response.json().catch(() => ({}));
					return {
						error: `Tavily search failed: ${errData.error || response.statusText}`,
					};
				}

				const data = await response.json();
				const results = (data.results || []).map(
					(r: {
						title?: string;
						url?: string;
						content?: string;
						score?: number;
					}) => ({
						title: r.title || "Untitled",
						url: r.url,
						snippet: r.content?.slice(0, 300) || "",
						score: r.score,
					}),
				);

				return {
					query,
					answer: data.answer || null,
					results,
					totalResults: results.length,
				};
			} catch (err) {
				return {
					error: `Search failed: ${err instanceof Error ? err.message : "Unknown error"}`,
				};
			}
		},
	});

	const searchAcademic = tool({
		description:
			"Search for academic papers and scientific research using Tavily with academic domain filtering. Use this for questions about scientific research, medical topics, or when peer-reviewed sources are needed.",
		inputSchema: z.object({
			query: z
				.string()
				.describe(
					"The research question or topic to search for in academic literature",
				),
		}),
		execute: async ({ query }) => {
			const tavilyKey = config.tavily;
			if (!tavilyKey) {
				return {
					error: "Tavily API key not configured. Add it in Settings > API Keys.",
				};
			}

			try {
				const response = await fetch("https://api.tavily.com/search", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${tavilyKey}`,
					},
					body: JSON.stringify({
						query,
						max_results: 8,
						search_depth: "advanced",
						include_answer: true,
						include_domains: [
							"scholar.google.com",
							"pubmed.ncbi.nlm.nih.gov",
							"arxiv.org",
							"nature.com",
							"science.org",
							"sciencedirect.com",
							"springer.com",
							"ncbi.nlm.nih.gov",
							"researchgate.net",
							"semanticscholar.org",
						],
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
						content?: string;
						score?: number;
					}) => ({
						title: r.title || "Untitled",
						url: r.url,
						abstract: r.content?.slice(0, 500) || "",
						score: r.score,
					}),
				);

				return {
					query,
					answer: data.answer || null,
					papers,
					totalResults: papers.length,
				};
			} catch (err) {
				return {
					error: `Academic search failed: ${err instanceof Error ? err.message : "Unknown error"}`,
				};
			}
		},
	});

	const fetchUrl = tool({
		description:
			"Fetch and extract the content of a specific URL using Tavily Extract. Use this when the user provides a URL to a paper, article, or webpage and wants it analyzed.",
		inputSchema: z.object({
			url: z
				.string()
				.url()
				.describe("The URL to fetch content from"),
		}),
		execute: async ({ url }) => {
			const tavilyKey = config.tavily;
			if (!tavilyKey) {
				return fallbackFetchUrl(url);
			}

			try {
				const response = await fetch("https://api.tavily.com/extract", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${tavilyKey}`,
					},
					body: JSON.stringify({
						urls: [url],
						format: "markdown",
					}),
				});

				if (!response.ok) {
					return fallbackFetchUrl(url);
				}

				const data = await response.json();
				const result = data.results?.[0];
				if (!result) {
					return fallbackFetchUrl(url);
				}

				return {
					url,
					content: result.raw_content?.slice(0, 5000) || "",
					source: "tavily",
				};
			} catch {
				return fallbackFetchUrl(url);
			}
		},
	});

	return { searchWeb, searchAcademic, fetchUrl };
}

// ─── Shared fetchUrl fallback ───────────────────────────────────────────────

function createFetchUrlTool(config: ResearchToolsConfig) {
	return tool({
		description:
			"Fetch and extract the content of a specific URL. Use this when the user provides a URL to a paper, article, or webpage and wants it analyzed, summarized, or discussed.",
		inputSchema: z.object({
			url: z
				.string()
				.url()
				.describe("The URL to fetch content from"),
		}),
		execute: async ({ url }) => {
			const exaKey = config.exa;
			if (!exaKey) {
				return fallbackFetchUrl(url);
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
}

async function fallbackFetchUrl(url: string) {
	try {
		const response = await fetch(url, {
			headers: { "User-Agent": "ResearchBot/1.0" },
			signal: AbortSignal.timeout(10000),
		});
		if (!response.ok) {
			return { error: `Failed to fetch URL: ${response.statusText}` };
		}
		const text = await response.text();
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
