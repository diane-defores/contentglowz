import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
	createAffiliation,
	getAffiliationsByUserId,
} from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

export async function GET(request: NextRequest) {
	try {
		const session = await auth();

		if (!session?.user) {
			return new ChatSDKError("unauthorized:chat").toResponse();
		}

		const { searchParams } = new URL(request.url);
		const projectId = searchParams.get("projectId") || undefined;

		const affiliations = await getAffiliationsByUserId({
			userId: session.user.id,
			projectId,
		});

		return NextResponse.json(affiliations);
	} catch (error) {
		console.error("Failed to get affiliations:", error);
		return NextResponse.json(
			{ error: "Failed to get affiliations" },
			{ status: 500 },
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const session = await auth();

		if (!session?.user) {
			return new ChatSDKError("unauthorized:chat").toResponse();
		}

		const body = await request.json();

		const affiliation = await createAffiliation({
			userId: session.user.id,
			projectId: body.projectId,
			name: body.name,
			url: body.url,
			category: body.category,
			commission: body.commission,
			keywords: body.keywords,
			status: body.status,
			notes: body.notes,
			expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
		});

		return NextResponse.json(affiliation, { status: 201 });
	} catch (error) {
		console.error("Failed to create affiliation:", error);
		return NextResponse.json(
			{ error: "Failed to create affiliation" },
			{ status: 500 },
		);
	}
}
