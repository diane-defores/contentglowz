import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
	deleteTemplate,
	getTemplateById,
	updateTemplate,
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
		const template = await getTemplateById({ id });

		if (!template) {
			return NextResponse.json(
				{ error: "Template not found" },
				{ status: 404 },
			);
		}

		if (template.userId !== userId && !template.isSystem) {
			return new ChatSDKError("forbidden:chat").toResponse();
		}

		return NextResponse.json(template);
	} catch (error) {
		console.error("Failed to get template:", error);
		return NextResponse.json(
			{ error: "Failed to get template" },
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
		const existing = await getTemplateById({ id });

		if (!existing) {
			return NextResponse.json(
				{ error: "Template not found" },
				{ status: 404 },
			);
		}

		if (existing.userId !== userId) {
			return new ChatSDKError("forbidden:chat").toResponse();
		}

		if (existing.isSystem) {
			return NextResponse.json(
				{ error: "Cannot edit system templates. Clone it first." },
				{ status: 403 },
			);
		}

		const body = await request.json();

		const template = await updateTemplate({
			id,
			name: body.name,
			slug: body.slug,
			contentType: body.contentType,
			description: body.description,
			sections: body.sections,
		});

		return NextResponse.json(template);
	} catch (error) {
		console.error("Failed to update template:", error);
		return NextResponse.json(
			{ error: "Failed to update template" },
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
		const existing = await getTemplateById({ id });

		if (!existing) {
			return NextResponse.json(
				{ error: "Template not found" },
				{ status: 404 },
			);
		}

		if (existing.userId !== userId) {
			return new ChatSDKError("forbidden:chat").toResponse();
		}

		if (existing.isSystem) {
			return NextResponse.json(
				{ error: "Cannot delete system templates" },
				{ status: 403 },
			);
		}

		await deleteTemplate({ id });

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Failed to delete template:", error);
		return NextResponse.json(
			{ error: "Failed to delete template" },
			{ status: 500 },
		);
	}
}
