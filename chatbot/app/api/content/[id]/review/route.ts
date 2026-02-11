import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
	getContentRecordById,
	updateContentRecord,
	createStatusChange,
} from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

/**
 * POST /api/content/[id]/review
 * Approve or reject a content record from the dashboard.
 * Body: { action: "approve" | "reject", note?: string }
 */
export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const session = await auth();
		if (!session?.user) {
			return new ChatSDKError("unauthorized:chat").toResponse();
		}

		const { id } = await params;
		const body = await request.json();
		const { action, note } = body as {
			action: "approve" | "reject";
			note?: string;
		};

		if (!action || !["approve", "reject"].includes(action)) {
			return NextResponse.json(
				{ error: "Invalid action. Must be 'approve' or 'reject'" },
				{ status: 400 },
			);
		}

		const record = await getContentRecordById({ id });
		if (!record) {
			return NextResponse.json(
				{ error: "Content record not found" },
				{ status: 404 },
			);
		}

		if (record.status !== "pending_review") {
			return NextResponse.json(
				{
					error: `Cannot ${action} content with status '${record.status}'. Must be 'pending_review'.`,
				},
				{ status: 400 },
			);
		}

		const toStatus = action === "approve" ? "approved" : "rejected";
		const reviewerEmail = session.user.email || session.user.id;

		// Create status change audit entry
		await createStatusChange({
			contentId: id,
			fromStatus: record.status,
			toStatus,
			changedBy: reviewerEmail,
			reason: note,
		});

		// Update the record
		const updated = await updateContentRecord({
			id,
			status: toStatus,
			reviewerNote: note || null,
			reviewedBy: reviewerEmail,
		});

		return NextResponse.json(updated);
	} catch (error) {
		console.error("Failed to review content:", error);
		return NextResponse.json(
			{ error: "Failed to review content" },
			{ status: 500 },
		);
	}
}
