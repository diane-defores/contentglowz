import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getWorkDomains, updateWorkDomain } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

export async function GET(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const projectId = searchParams.get("projectId") || undefined;

		const domains = await getWorkDomains({ projectId });

		return NextResponse.json(domains);
	} catch (error) {
		console.error("Failed to get work domains:", error);
		return NextResponse.json(
			{ error: "Failed to get work domains" },
			{ status: 500 },
		);
	}
}

export async function PATCH(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { projectId, domain, ...fields } = body;

		if (!projectId || !domain) {
			return NextResponse.json(
				{ error: "projectId and domain are required" },
				{ status: 400 },
			);
		}

		const result = await updateWorkDomain({
			projectId,
			domain,
			...fields,
		});

		return NextResponse.json(result);
	} catch (error) {
		console.error("Failed to update work domain:", error);
		return NextResponse.json(
			{ error: "Failed to update work domain" },
			{ status: 500 },
		);
	}
}
