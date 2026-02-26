import { auth } from "@clerk/nextjs/server";
import { and, desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { robotRun } from "@/lib/db/schema";

export async function GET(request: NextRequest) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { searchParams } = request.nextUrl;
	const robotName = searchParams.get("robot_name");
	const status = searchParams.get("status") as "running" | "success" | "error" | null;
	const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 200);

	try {
		const db = getDb();

		const where = and(
			robotName ? eq(robotRun.robotName, robotName) : undefined,
			status ? eq(robotRun.status, status) : undefined,
		);

		const runs = await db
			.select()
			.from(robotRun)
			.where(where)
			.orderBy(desc(robotRun.startedAt))
			.limit(limit);

		return NextResponse.json({ runs, total: runs.length });
	} catch (error) {
		console.error("[runs] DB error:", error);
		return NextResponse.json({ runs: [], total: 0, error: "DB unavailable" }, { status: 500 });
	}
}
