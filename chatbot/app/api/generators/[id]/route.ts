import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
	deleteGenerator,
	getGeneratorById,
	updateGenerator,
} from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;
		const generator = await getGeneratorById({ id });

		if (!generator) {
			return NextResponse.json(
				{ error: "Generator not found" },
				{ status: 404 },
			);
		}

		if (generator.userId !== userId) {
			return new ChatSDKError("forbidden:chat").toResponse();
		}

		return NextResponse.json(generator);
	} catch (error) {
		console.error("Failed to get generator:", error);
		return NextResponse.json(
			{ error: "Failed to get generator" },
			{ status: 500 },
		);
	}
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;
		const existing = await getGeneratorById({ id });

		if (!existing) {
			return NextResponse.json(
				{ error: "Generator not found" },
				{ status: 404 },
			);
		}

		if (existing.userId !== userId) {
			return new ChatSDKError("forbidden:chat").toResponse();
		}

		const body = await request.json();

		const generator = await updateGenerator({
			id,
			name: body.name,
			topics: body.topics,
			targetAudience: body.targetAudience,
			tone: body.tone,
			competitorEmails: body.competitorEmails,
			includeEmailInsights: body.includeEmailInsights,
			maxSections: body.maxSections,
			schedule: body.schedule,
			scheduleDay: body.scheduleDay,
			scheduleTime: body.scheduleTime,
			status: body.status,
			lastRunAt: body.lastRunAt ? new Date(body.lastRunAt) : undefined,
			lastRunStatus: body.lastRunStatus,
		});

		return NextResponse.json(generator);
	} catch (error) {
		console.error("Failed to update generator:", error);
		return NextResponse.json(
			{ error: "Failed to update generator" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;
		const existing = await getGeneratorById({ id });

		if (!existing) {
			return NextResponse.json(
				{ error: "Generator not found" },
				{ status: 404 },
			);
		}

		if (existing.userId !== userId) {
			return new ChatSDKError("forbidden:chat").toResponse();
		}

		await deleteGenerator({ id });

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Failed to delete generator:", error);
		return NextResponse.json(
			{ error: "Failed to delete generator" },
			{ status: 500 },
		);
	}
}
