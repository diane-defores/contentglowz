import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { createActivityLog, getActivityLogsByUserId } from "@/lib/db/queries";

export async function GET(request: NextRequest) {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { searchParams } = new URL(request.url);
		const projectId = searchParams.get("projectId") || undefined;
		const robotId = searchParams.get("robotId") || undefined;
		const status = searchParams.get("status") as any || undefined;
		const limit = parseInt(searchParams.get("limit") || "50", 10);

		const logs = await getActivityLogsByUserId({
			userId: session.user.id,
			projectId,
			robotId,
			status,
			limit,
		});

		return NextResponse.json(logs);
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to fetch activity logs" },
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { projectId, action, robotId, status, details } = body;

		if (!action) {
			return NextResponse.json(
				{ error: "Action is required" },
				{ status: 400 }
			);
		}

		const log = await createActivityLog({
			userId: session.user.id,
			projectId,
			action,
			robotId,
			status,
			details,
		});

		return NextResponse.json(log, { status: 201 });
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to create activity log" },
			{ status: 500 }
		);
	}
}
