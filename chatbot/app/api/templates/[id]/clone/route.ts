import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { cloneTemplate, getTemplateById } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

export async function POST(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const session = await auth();

		if (!session?.user) {
			return new ChatSDKError("unauthorized:chat").toResponse();
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
			userId: session.user.id,
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
