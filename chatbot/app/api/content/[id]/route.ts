import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
	getContentRecordById,
	updateContentRecord,
	getStatusChangesByContentId,
} from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const session = await auth();
		if (!session?.user) {
			return new ChatSDKError("unauthorized:chat").toResponse();
		}

		const { id } = await params;
		const record = await getContentRecordById({ id });

		if (!record) {
			return NextResponse.json(
				{ error: "Content record not found" },
				{ status: 404 },
			);
		}

		// Include history
		const history = await getStatusChangesByContentId({ contentId: id });

		return NextResponse.json({ ...record, history });
	} catch (error) {
		console.error("Failed to get content record:", error);
		return NextResponse.json(
			{ error: "Failed to get content record" },
			{ status: 500 },
		);
	}
}

export async function PATCH(
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

		const record = await updateContentRecord({
			id,
			...body,
		});

		if (!record) {
			return NextResponse.json(
				{ error: "Content record not found" },
				{ status: 404 },
			);
		}

		return NextResponse.json(record);
	} catch (error) {
		console.error("Failed to update content record:", error);
		return NextResponse.json(
			{ error: "Failed to update content record" },
			{ status: 500 },
		);
	}
}
