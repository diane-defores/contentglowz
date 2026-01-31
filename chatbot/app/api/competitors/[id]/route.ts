import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
	deleteCompetitor,
	getCompetitorById,
	updateCompetitor,
} from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const session = await auth();

		if (!session?.user) {
			return new ChatSDKError("unauthorized:chat").toResponse();
		}

		const { id } = await params;
		const competitor = await getCompetitorById({ id });

		if (!competitor) {
			return NextResponse.json(
				{ error: "Competitor not found" },
				{ status: 404 },
			);
		}

		if (competitor.userId !== session.user.id) {
			return new ChatSDKError("forbidden:chat").toResponse();
		}

		return NextResponse.json(competitor);
	} catch (error) {
		console.error("Failed to get competitor:", error);
		return NextResponse.json(
			{ error: "Failed to get competitor" },
			{ status: 500 },
		);
	}
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const session = await auth();

		if (!session?.user) {
			return new ChatSDKError("unauthorized:chat").toResponse();
		}

		const { id } = await params;
		const existing = await getCompetitorById({ id });

		if (!existing) {
			return NextResponse.json(
				{ error: "Competitor not found" },
				{ status: 404 },
			);
		}

		if (existing.userId !== session.user.id) {
			return new ChatSDKError("forbidden:chat").toResponse();
		}

		const body = await request.json();

		const competitor = await updateCompetitor({
			id,
			name: body.name,
			url: body.url,
			niche: body.niche,
			priority: body.priority,
			notes: body.notes,
			lastAnalyzedAt: body.lastAnalyzedAt
				? new Date(body.lastAnalyzedAt)
				: undefined,
			analysisData: body.analysisData,
		});

		return NextResponse.json(competitor);
	} catch (error) {
		console.error("Failed to update competitor:", error);
		return NextResponse.json(
			{ error: "Failed to update competitor" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const session = await auth();

		if (!session?.user) {
			return new ChatSDKError("unauthorized:chat").toResponse();
		}

		const { id } = await params;
		const existing = await getCompetitorById({ id });

		if (!existing) {
			return NextResponse.json(
				{ error: "Competitor not found" },
				{ status: 404 },
			);
		}

		if (existing.userId !== session.user.id) {
			return new ChatSDKError("forbidden:chat").toResponse();
		}

		await deleteCompetitor({ id });

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Failed to delete competitor:", error);
		return NextResponse.json(
			{ error: "Failed to delete competitor" },
			{ status: 500 },
		);
	}
}
