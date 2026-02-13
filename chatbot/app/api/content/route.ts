import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getContentRecords, getContentStats } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

export async function GET(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const status = searchParams.get("status") || undefined;
		const contentType = searchParams.get("contentType") || undefined;
		const sourceRobot = searchParams.get("sourceRobot") || undefined;
		const projectId = searchParams.get("projectId") || undefined;
		const limit = Number.parseInt(searchParams.get("limit") || "50", 10);

		const records = await getContentRecords({
			status,
			contentType,
			sourceRobot,
			projectId,
			limit,
		});

		return NextResponse.json(records);
	} catch (error) {
		console.error("Failed to get content records:", error);
		return NextResponse.json(
			{ error: "Failed to get content records" },
			{ status: 500 },
		);
	}
}
