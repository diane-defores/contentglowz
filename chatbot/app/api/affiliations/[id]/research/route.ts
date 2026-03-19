import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateText } from "ai";
import { myProvider } from "@/lib/ai/providers";
import {
	getAffiliationById,
	getUserSettings,
	updateAffiliation,
} from "@/lib/db/queries";

interface ExaResult {
	title: string;
	url: string;
	text?: string;
	highlights?: string[];
}

interface ExaSearchResponse {
	results: ExaResult[];
}

async function searchExa(
	query: string,
	exaKey: string,
): Promise<ExaResult[]> {
	const response = await fetch("https://api.exa.ai/search", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"x-api-key": exaKey,
		},
		body: JSON.stringify({
			query,
			numResults: 5,
			type: "auto",
			useAutoprompt: true,
			contents: {
				text: { maxCharacters: 1500 },
				highlights: { numSentences: 3 },
			},
		}),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Exa API error (${response.status}): ${errorText}`);
	}

	const data: ExaSearchResponse = await response.json();
	return data.results || [];
}

function extractDomain(url: string): string {
	try {
		return new URL(url).hostname.replace("www.", "");
	} catch {
		return url;
	}
}

export async function POST(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;
		const affiliation = await getAffiliationById({ id });

		if (!affiliation) {
			return NextResponse.json(
				{ error: "Affiliation not found" },
				{ status: 404 },
			);
		}

		if (affiliation.userId !== userId) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		// Get user's Exa API key from settings
		const settings = await getUserSettings({ userId });
		const exaKey = settings.apiKeys?.exa;

		if (!exaKey) {
			return NextResponse.json(
				{
					error:
						"Exa API key not configured. Please add your Exa API key in Settings.",
				},
				{ status: 400 },
			);
		}

		// Run Exa searches in parallel
		const domain = extractDomain(affiliation.url);
		const queries = [
			`${affiliation.name} affiliate program review`,
			`${affiliation.name} ${domain} company information`,
			`${affiliation.name} affiliate commission payment terms`,
		];

		let allResults: ExaResult[] = [];
		try {
			const searchResults = await Promise.all(
				queries.map((query) => searchExa(query, exaKey)),
			);
			allResults = searchResults.flat();
		} catch (error) {
			console.error("Exa search failed:", error);
			return NextResponse.json(
				{
					error: `Research failed: ${error instanceof Error ? error.message : "Exa search error"}`,
				},
				{ status: 502 },
			);
		}

		if (allResults.length === 0) {
			return NextResponse.json(
				{ error: "No research results found. Try a different affiliation." },
				{ status: 404 },
			);
		}

		// Build context from search results
		const researchContext = allResults
			.map((result, i) => {
				const highlights = result.highlights?.join(" ") || "";
				const text = result.text || "";
				return `[${i + 1}] ${result.title}\nURL: ${result.url}\n${highlights}\n${text}`.trim();
			})
			.join("\n\n---\n\n");

		// Summarize with LLM
		let summary: string;
		try {
			const { text } = await generateText({
				model: myProvider.languageModel("chat-model"),
				prompt: `You are researching the affiliate program "${affiliation.name}" (${affiliation.url}).

Based on the following search results, provide a structured summary. Be factual and concise. If information is not available in the results, say "Not found in results" for that section.

Search Results:
${researchContext}

Provide the summary in this exact format:

## Company Background
[When they started, what they do, their market position]

## Program Reputation & Reviews
[What affiliates say, common praise and complaints, trustworthiness]

## Commission Structure & Payments
[Commission rates, payment methods, payment schedule, minimum payout threshold]

## Requirements & Conditions
[Approval requirements, cookie duration, restrictions, terms to be aware of]

## Contact Information
[Affiliate manager contacts, support channels, relevant URLs]`,
			});
			summary = text;
		} catch (error) {
			console.error("LLM summarization failed:", error);
			return NextResponse.json(
				{
					error: `Summarization failed: ${error instanceof Error ? error.message : "LLM error"}`,
				},
				{ status: 502 },
			);
		}

		// Save research summary and date to the affiliation
		const updated = await updateAffiliation({
			id,
			researchSummary: summary,
			researchedAt: new Date(),
		});

		return NextResponse.json(updated);
	} catch (error) {
		console.error("Failed to research affiliation:", error);
		return NextResponse.json(
			{ error: "Failed to research affiliation" },
			{ status: 500 },
		);
	}
}
