import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
	createGenerator,
	getGeneratorsByUserId,
} from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

export async function GET(request: NextRequest) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const projectId = searchParams.get("projectId") || undefined;

		const generators = await getGeneratorsByUserId({
			userId,
			projectId,
		});

		return NextResponse.json(generators);
	} catch (error) {
		console.error("Failed to get generators:", error);
		return NextResponse.json(
			{ error: "Failed to get generators" },
			{ status: 500 },
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();

		const generator = await createGenerator({
			userId,
			projectId: body.projectId,
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
		});

		return NextResponse.json(generator, { status: 201 });
	} catch (error) {
		console.error("Failed to create generator:", error);
		const message =
			error instanceof Error ? error.message : "Failed to create generator";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
