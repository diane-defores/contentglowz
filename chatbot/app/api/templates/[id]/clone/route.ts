import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { cloneTemplate, getTemplateById } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

export async function POST(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;
		const existing = await getTemplateById({ id });

		if (!existing) {
			return NextResponse.json(
				{ error: "Template not found" },
				{ status: 404 },
			);
		}

		// Any user can clone any template they can see (including system templates)
		const cloned = await cloneTemplate({
			id,
			userId,
		});

		if (!cloned) {
			return NextResponse.json(
				{ error: "Failed to clone template" },
				{ status: 500 },
			);
		}

		return NextResponse.json(cloned, { status: 201 });
	} catch (error) {
		console.error("Failed to clone template:", error);
		return NextResponse.json(
			{ error: "Failed to clone template" },
			{ status: 500 },
		);
	}
}
