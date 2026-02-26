import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const SEO_API_URL = process.env.SEO_API_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { searchParams } = request.nextUrl;
	const params = new URLSearchParams();
	if (searchParams.get("robot_name")) params.set("robot_name", searchParams.get("robot_name")!);
	if (searchParams.get("workflow_type")) params.set("workflow_type", searchParams.get("workflow_type")!);
	if (searchParams.get("status")) params.set("status", searchParams.get("status")!);
	if (searchParams.get("limit")) params.set("limit", searchParams.get("limit")!);

	try {
		const response = await fetch(`${SEO_API_URL}/runs?${params}`, {
			signal: AbortSignal.timeout(8000),
		});
		if (!response.ok) {
			return NextResponse.json({ error: `Upstream error: ${response.status}` }, { status: response.status });
		}
		const data = await response.json();
		return NextResponse.json(data);
	} catch {
		// Graceful fallback when Python server is down
		return NextResponse.json({ runs: [], total: 0, offline: true });
	}
}
