import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
	deleteAffiliation,
	getAffiliationById,
	updateAffiliation,
} from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;
		const affiliation = await getAffiliationById({ id });

		if (!affiliation) {
			return NextResponse.json(
				{ error: "Affiliation not found" },
				{ status: 404 },
			);
		}

		if (affiliation.userId !== userId) {
			return new ChatSDKError("forbidden:chat").toResponse();
		}

		return NextResponse.json(affiliation);
	} catch (error) {
		console.error("Failed to get affiliation:", error);
		return NextResponse.json(
			{ error: "Failed to get affiliation" },
			{ status: 500 },
		);
	}
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;
		const existing = await getAffiliationById({ id });

		if (!existing) {
			return NextResponse.json(
				{ error: "Affiliation not found" },
				{ status: 404 },
			);
		}

		if (existing.userId !== userId) {
			return new ChatSDKError("forbidden:chat").toResponse();
		}

		const body = await request.json();

		const affiliation = await updateAffiliation({
			id,
			name: body.name,
			url: body.url,
			category: body.category,
			commission: body.commission,
			keywords: body.keywords,
			status: body.status,
			notes: body.notes,
			description: body.description,
			contactUrl: body.contactUrl,
			loginUrl: body.loginUrl,
			expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
		});

		return NextResponse.json(affiliation);
	} catch (error) {
		console.error("Failed to update affiliation:", error);
		return NextResponse.json(
			{ error: "Failed to update affiliation" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;
		const existing = await getAffiliationById({ id });

		if (!existing) {
			return NextResponse.json(
				{ error: "Affiliation not found" },
				{ status: 404 },
			);
		}

		if (existing.userId !== userId) {
			return new ChatSDKError("forbidden:chat").toResponse();
		}

		await deleteAffiliation({ id });

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Failed to delete affiliation:", error);
		return NextResponse.json(
			{ error: "Failed to delete affiliation" },
			{ status: 500 },
		);
	}
}
