/**
 * Research History API Route
 *
 * Lists and deletes research conversations.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { deleteChatById, getChatsByUserId } from "@/lib/db/queries";

export async function GET(request: NextRequest) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { searchParams } = new URL(request.url);
	const projectId = searchParams.get("projectId") || undefined;

	try {
		const result = await getChatsByUserId({
			id: userId,
			projectId,
			type: "research",
			limit: 50,
			startingAfter: null,
			endingBefore: null,
		});

		return NextResponse.json(result.chats);
	} catch {
		return NextResponse.json(
			{ error: "Failed to fetch research history" },
			{ status: 500 },
		);
	}
}

export async function DELETE(request: NextRequest) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { searchParams } = new URL(request.url);
	const id = searchParams.get("id");

	if (!id) {
		return NextResponse.json({ error: "Missing id" }, { status: 400 });
	}

	try {
		await deleteChatById({ id });
		return NextResponse.json({ success: true });
	} catch {
		return NextResponse.json(
			{ error: "Failed to delete research chat" },
			{ status: 500 },
		);
	}
}
