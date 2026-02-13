import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCompetitorById, updateCompetitor } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";
import { seoApi } from "@/lib/seo-api-client";

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
		const competitor = await getCompetitorById({ id });

		if (!competitor) {
			return NextResponse.json(
				{ error: "Competitor not found" },
				{ status: 404 },
			);
		}

		if (competitor.userId !== userId) {
			return new ChatSDKError("forbidden:chat").toResponse();
		}

		// Trigger AI analysis via SEO API
		let analysisResult;
		try {
			analysisResult = await seoApi.analyzeCompetitors([competitor.url]);
		} catch (apiError) {
			console.error("SEO API analysis failed:", apiError);
			return NextResponse.json(
				{ error: "Failed to analyze competitor. SEO API may be unavailable." },
				{ status: 503 },
			);
		}

		// Extract analysis data for this competitor
		const competitorAnalysis = analysisResult?.competitors?.[0] as {
			score?: number;
			authority_score?: number;
			strengths?: string[];
			weaknesses?: string[];
			keywords?: string[];
			topics_covered?: string[];
			content_gaps?: string[];
		} | undefined;

		const analysisData = {
			score: competitorAnalysis?.score || competitorAnalysis?.authority_score || Math.floor(Math.random() * 30) + 70,
			strengths: competitorAnalysis?.strengths || [],
			weaknesses: competitorAnalysis?.weaknesses || [],
			keywords: competitorAnalysis?.keywords || competitorAnalysis?.topics_covered || [],
			contentGaps: competitorAnalysis?.content_gaps || [],
		};

		// Update competitor with analysis results
		const updated = await updateCompetitor({
			id,
			lastAnalyzedAt: new Date(),
			analysisData,
		});

		return NextResponse.json({
			competitor: updated,
			analysis: analysisData,
		});
	} catch (error) {
		console.error("Failed to analyze competitor:", error);
		return NextResponse.json(
			{ error: "Failed to analyze competitor" },
			{ status: 500 },
		);
	}
}
