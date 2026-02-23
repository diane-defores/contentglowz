import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getGitHubToken } from "@/lib/github";

export async function GET() {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const token = await getGitHubToken(userId);
		return NextResponse.json({ connected: !!token });
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to check GitHub status" },
			{ status: 500 },
		);
	}
}
