/**
 * Extra Research Tools (free, no API keys required)
 *
 * - YouTube Transcript extraction
 * - Wikipedia search & summaries
 * - Semantic Scholar paper search with citation graphs
 */
import { tool } from "ai";
import { z } from "zod";

/**
 * Creates provider-independent research tools (all free).
 */
export function createExtraResearchTools() {
	return {
		youtubeTranscript,
		wikipediaSearch,
		semanticScholar,
	};
}

// ─── YouTube Transcript ─────────────────────────────────────────────────────

const youtubeTranscript = tool({
	description:
		"Extract the transcript/subtitles from a YouTube video. Use this when the user shares a YouTube link or wants to analyze video content. Returns the full text of the video's captions.",
	inputSchema: z.object({
		url: z.string().describe("YouTube video URL or video ID"),
	}),
	execute: async ({ url }) => {
		const videoId = extractYouTubeId(url);
		if (!videoId) {
			return { error: "Invalid YouTube URL or video ID" };
		}

		try {
			// Fetch the video page to extract caption tracks
			const pageResponse = await fetch(
				`https://www.youtube.com/watch?v=${videoId}`,
				{
					headers: {
						"User-Agent":
							"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
						"Accept-Language": "en-US,en;q=0.9",
					},
					signal: AbortSignal.timeout(10000),
				},
			);

			if (!pageResponse.ok) {
				return { error: `Failed to fetch YouTube page: ${pageResponse.statusText}` };
			}

			const html = await pageResponse.text();

			// Extract title
			const titleMatch = html.match(
				/"title":"(.*?)"/,
			);
			const title = titleMatch
				? titleMatch[1].replace(/\\u0026/g, "&").replace(/\\"/g, '"')
				: "Unknown";

			// Extract caption tracks from ytInitialPlayerResponse
			const captionMatch = html.match(
				/"captionTracks":\s*(\[.*?\])/,
			);

			if (!captionMatch) {
				return {
					error:
						"No captions available for this video. The video may not have subtitles.",
					videoId,
					title,
				};
			}

			let captionTracks: Array<{
				baseUrl: string;
				languageCode: string;
				name?: { simpleText?: string };
			}>;
			try {
				captionTracks = JSON.parse(captionMatch[1]);
			} catch {
				return { error: "Failed to parse caption data" };
			}

			if (!captionTracks.length) {
				return { error: "No caption tracks found", videoId, title };
			}

			// Prefer English, then first available
			const track =
				captionTracks.find((t) => t.languageCode === "en") ||
				captionTracks.find((t) => t.languageCode.startsWith("en")) ||
				captionTracks[0];

			// Fetch the caption XML
			const captionUrl = track.baseUrl.replace(/\\u0026/g, "&");
			const captionResponse = await fetch(captionUrl, {
				signal: AbortSignal.timeout(10000),
			});

			if (!captionResponse.ok) {
				return { error: "Failed to fetch captions" };
			}

			const captionXml = await captionResponse.text();

			// Parse XML to extract text
			const textSegments: string[] = [];
			const regex = /<text[^>]*>(.*?)<\/text>/gs;
			let match: RegExpExecArray | null;
			while ((match = regex.exec(captionXml)) !== null) {
				const text = match[1]
					.replace(/&amp;/g, "&")
					.replace(/&lt;/g, "<")
					.replace(/&gt;/g, ">")
					.replace(/&quot;/g, '"')
					.replace(/&#39;/g, "'")
					.replace(/\n/g, " ")
					.trim();
				if (text) textSegments.push(text);
			}

			const transcript = textSegments.join(" ");

			if (!transcript) {
				return { error: "Captions were empty", videoId, title };
			}

			return {
				videoId,
				title,
				language: track.languageCode,
				transcript: transcript.slice(0, 8000),
				truncated: transcript.length > 8000,
				totalLength: transcript.length,
			};
		} catch (err) {
			return {
				error: `Failed to extract transcript: ${err instanceof Error ? err.message : "Unknown error"}`,
			};
		}
	},
});

function extractYouTubeId(input: string): string | null {
	// Direct video ID (11 chars)
	if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;

	try {
		const url = new URL(input);
		// youtube.com/watch?v=ID
		if (url.searchParams.has("v")) return url.searchParams.get("v");
		// youtu.be/ID
		if (url.hostname === "youtu.be") return url.pathname.slice(1);
		// youtube.com/embed/ID or /shorts/ID
		const pathMatch = url.pathname.match(
			/\/(embed|shorts|v)\/([a-zA-Z0-9_-]{11})/,
		);
		if (pathMatch) return pathMatch[2];
	} catch {
		// not a URL
	}
	return null;
}

// ─── Wikipedia ──────────────────────────────────────────────────────────────

const wikipediaSearch = tool({
	description:
		"Search Wikipedia for factual information, definitions, and overviews. Returns article summaries with sources. Use this for quick factual lookups, definitions, historical context, or background research on any topic.",
	inputSchema: z.object({
		query: z.string().describe("The topic or question to search for"),
		language: z
			.enum(["en", "fr", "de", "es", "it", "pt", "ja", "zh"])
			.default("en")
			.describe("Wikipedia language edition to search"),
	}),
	execute: async ({ query, language }) => {
		try {
			// Search for articles
			const searchUrl = new URL(
				`https://${language}.wikipedia.org/w/api.php`,
			);
			searchUrl.searchParams.set("action", "query");
			searchUrl.searchParams.set("list", "search");
			searchUrl.searchParams.set("srsearch", query);
			searchUrl.searchParams.set("srlimit", "3");
			searchUrl.searchParams.set("format", "json");
			searchUrl.searchParams.set("origin", "*");

			const searchResponse = await fetch(searchUrl, {
				signal: AbortSignal.timeout(8000),
			});

			if (!searchResponse.ok) {
				return { error: `Wikipedia search failed: ${searchResponse.statusText}` };
			}

			const searchData = await searchResponse.json();
			const searchResults = searchData.query?.search || [];

			if (searchResults.length === 0) {
				return { query, results: [], message: "No Wikipedia articles found" };
			}

			// Fetch summaries for top results
			const summaries = await Promise.all(
				searchResults.map(
					async (result: { title: string; snippet: string }) => {
						try {
							const summaryUrl = `https://${language}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(result.title)}`;
							const summaryResponse = await fetch(summaryUrl, {
								signal: AbortSignal.timeout(5000),
							});

							if (!summaryResponse.ok) {
								return {
									title: result.title,
									snippet: result.snippet.replace(/<[^>]+>/g, ""),
									url: `https://${language}.wikipedia.org/wiki/${encodeURIComponent(result.title)}`,
								};
							}

							const summary = await summaryResponse.json();
							return {
								title: summary.title,
								description: summary.description,
								extract: summary.extract?.slice(0, 1000),
								url: summary.content_urls?.desktop?.page,
								thumbnail: summary.thumbnail?.source,
							};
						} catch {
							return {
								title: result.title,
								snippet: result.snippet.replace(/<[^>]+>/g, ""),
								url: `https://${language}.wikipedia.org/wiki/${encodeURIComponent(result.title)}`,
							};
						}
					},
				),
			);

			return { query, results: summaries };
		} catch (err) {
			return {
				error: `Wikipedia search failed: ${err instanceof Error ? err.message : "Unknown error"}`,
			};
		}
	},
});

// ─── Semantic Scholar ───────────────────────────────────────────────────────

const semanticScholar = tool({
	description:
		"Search Semantic Scholar for academic papers with citation counts and influence scores. Use this to find highly-cited papers, explore citation graphs, or discover related research. Best for finding foundational papers and understanding research impact.",
	inputSchema: z.object({
		query: z
			.string()
			.describe("The research topic or paper title to search for"),
		limit: z
			.number()
			.min(1)
			.max(10)
			.default(5)
			.describe("Number of papers to return"),
		year: z
			.string()
			.optional()
			.describe(
				"Filter by year range (e.g. '2020-2024' or '2023-')",
			),
		fieldsOfStudy: z
			.array(z.string())
			.optional()
			.describe(
				"Filter by field (e.g. ['Computer Science', 'Medicine'])",
			),
	}),
	execute: async ({ query, limit, year, fieldsOfStudy }) => {
		try {
			const params = new URLSearchParams({
				query,
				limit: String(limit),
				fields:
					"title,abstract,authors,year,citationCount,influentialCitationCount,url,venue,openAccessPdf,tldr",
			});
			if (year) params.set("year", year);
			if (fieldsOfStudy?.length)
				params.set("fieldsOfStudy", fieldsOfStudy.join(","));

			const response = await fetch(
				`https://api.semanticscholar.org/graph/v1/paper/search?${params}`,
				{
					headers: {
						"User-Agent": "ResearchBot/1.0",
					},
					signal: AbortSignal.timeout(10000),
				},
			);

			if (!response.ok) {
				if (response.status === 429) {
					return {
						error: "Semantic Scholar rate limit reached. Try again in a moment.",
					};
				}
				return {
					error: `Semantic Scholar search failed: ${response.statusText}`,
				};
			}

			const data = await response.json();
			const papers = (data.data || []).map(
				(p: {
					paperId?: string;
					title?: string;
					abstract?: string;
					authors?: Array<{ name: string }>;
					year?: number;
					citationCount?: number;
					influentialCitationCount?: number;
					url?: string;
					venue?: string;
					openAccessPdf?: { url: string };
					tldr?: { text: string };
				}) => ({
					title: p.title || "Untitled",
					url: p.url || `https://www.semanticscholar.org/paper/${p.paperId}`,
					pdfUrl: p.openAccessPdf?.url,
					abstract: p.abstract?.slice(0, 500),
					tldr: p.tldr?.text,
					authors: p.authors
						?.slice(0, 4)
						.map((a) => a.name)
						.join(", "),
					year: p.year,
					venue: p.venue,
					citations: p.citationCount,
					influentialCitations: p.influentialCitationCount,
				}),
			);

			return {
				query,
				papers,
				totalResults: data.total || papers.length,
			};
		} catch (err) {
			return {
				error: `Semantic Scholar search failed: ${err instanceof Error ? err.message : "Unknown error"}`,
			};
		}
	},
});
