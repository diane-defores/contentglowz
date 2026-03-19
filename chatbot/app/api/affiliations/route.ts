import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
	createAffiliation,
	getAffiliationsByUserId,
} from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

export async function GET(request: NextRequest) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const projectId = searchParams.get("projectId") || undefined;

		const affiliations = await getAffiliationsByUserId({
			userId,
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
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();

		const affiliation = await createAffiliation({
			userId,
			projectId: body.projectId,
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
