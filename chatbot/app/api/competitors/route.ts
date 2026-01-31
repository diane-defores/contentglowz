import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
	createCompetitor,
	getCompetitorsByUserId,
} from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

export async function GET() {
	try {
		const session = await auth();

		if (!session?.user) {
			return new ChatSDKError("unauthorized:chat").toResponse();
		}

		const competitors = await getCompetitorsByUserId({
			userId: session.user.id,
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
		const session = await auth();

		if (!session?.user) {
			return new ChatSDKError("unauthorized:chat").toResponse();
		}

		const body = await request.json();

		const competitor = await createCompetitor({
			userId: session.user.id,
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
