import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getContentStats } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

export async function GET(request: NextRequest) {
	try {
		const session = await auth();
		if (!session?.user) {
			return new ChatSDKError("unauthorized:chat").toResponse();
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
