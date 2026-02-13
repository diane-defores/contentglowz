import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getActivityLogById, updateActivityLog } from "@/lib/db/queries";

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { id } = await params;
		const log = await getActivityLogById({ id });

		if (!log) {
			return NextResponse.json({ error: "Activity log not found" }, { status: 404 });
		}

		// Verify ownership
		if (log.userId !== userId) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		return NextResponse.json(log);
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to fetch activity log" },
			{ status: 500 }
		);
	}
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { id } = await params;
		const existing = await getActivityLogById({ id });

		if (!existing) {
			return NextResponse.json({ error: "Activity log not found" }, { status: 404 });
		}

		if (existing.userId !== userId) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const body = await request.json();
		const updated = await updateActivityLog({
			id,
			status: body.status,
			details: body.details,
			completedAt: body.completedAt ? new Date(body.completedAt) : undefined,
		});

		return NextResponse.json(updated);
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to update activity log" },
			{ status: 500 }
		);
	}
}
