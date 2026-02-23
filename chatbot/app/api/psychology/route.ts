import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCreatorProfile, upsertCreatorProfile } from "@/lib/db/queries";

export async function GET(request: NextRequest) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const projectId = request.nextUrl.searchParams.get("projectId") || undefined;
		const profile = await getCreatorProfile({ userId, projectId });
		return NextResponse.json(profile);
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to fetch creator profile" },
			{ status: 500 },
		);
	}
}

export async function PUT(request: NextRequest) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const body = await request.json();
		const profile = await upsertCreatorProfile({
			userId,
			projectId: body.projectId,
			displayName: body.displayName,
			voice: body.voice,
			positioning: body.positioning,
			values: body.values,
			currentChapterId: body.currentChapterId,
		});
		return NextResponse.json(profile);
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to update creator profile" },
			{ status: 500 },
		);
	}
}
