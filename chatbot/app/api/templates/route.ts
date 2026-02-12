import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { createTemplate, getTemplatesByUserId } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

export async function GET(request: NextRequest) {
	try {
		const session = await auth();

		if (!session?.user) {
			return new ChatSDKError("unauthorized:chat").toResponse();
		}

		const { searchParams } = new URL(request.url);
		const projectId = searchParams.get("projectId") || undefined;
		const contentType = searchParams.get("contentType") || undefined;

		const templates = await getTemplatesByUserId({
			userId: session.user.id,
			projectId,
			contentType,
		});

		return NextResponse.json(templates);
	} catch (error) {
		console.error("Failed to get templates:", error);
		return NextResponse.json(
			{ error: "Failed to get templates" },
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

		const template = await createTemplate({
			userId: session.user.id,
			projectId: body.projectId,
			name: body.name,
			slug: body.slug,
			contentType: body.contentType,
			description: body.description,
			isSystem: body.isSystem,
			sections: body.sections || [],
		});

		return NextResponse.json(template, { status: 201 });
	} catch (error) {
		console.error("Failed to create template:", error);
		const message =
			error instanceof Error ? error.message : "Failed to create template";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
