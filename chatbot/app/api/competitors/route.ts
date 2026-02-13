import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
	createCompetitor,
	getCompetitorsByUserId,
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

		const competitors = await getCompetitorsByUserId({
			userId,
			projectId,
		});

		return NextResponse.json(competitors);
	} catch (error) {
		console.error("Failed to get competitors:", error);
		return NextResponse.json(
			{ error: "Failed to get competitors" },
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

		const competitor = await createCompetitor({
			userId,
			projectId: body.projectId,
			name: body.name,
			url: body.url,
			niche: body.niche,
			priority: body.priority,
			notes: body.notes,
		});

		return NextResponse.json(competitor, { status: 201 });
	} catch (error) {
		console.error("Failed to create competitor:", error);
		return NextResponse.json(
			{ error: "Failed to create competitor" },
			{ status: 500 },
		);
	}
}
