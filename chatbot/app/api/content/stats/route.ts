import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getContentStats } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

export async function GET(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const projectId = searchParams.get("projectId") || undefined;

		const stats = await getContentStats({ projectId });

		return NextResponse.json(stats);
	} catch (error) {
		console.error("Failed to get content stats:", error);
		return NextResponse.json(
			{ error: "Failed to get content stats" },
			{ status: 500 },
		);
	}
}
