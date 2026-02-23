import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
	deleteContentSource,
	getContentSourceById,
	updateContentSource,
} from "@/lib/db/queries";

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { id } = await params;
		const source = await getContentSourceById({ id });

		if (!source) {
			return NextResponse.json(
				{ error: "Content source not found" },
				{ status: 404 },
			);
		}

		if (source.userId !== userId) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		return NextResponse.json(source);
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to fetch content source" },
			{ status: 500 },
		);
	}
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { id } = await params;
		const existing = await getContentSourceById({ id });

		if (!existing) {
			return NextResponse.json(
				{ error: "Content source not found" },
				{ status: 404 },
			);
		}

		if (existing.userId !== userId) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const body = await request.json();
		const updated = await updateContentSource({ id, ...body });

		return NextResponse.json(updated);
	} catch (error) {
		console.error("Failed to update content source:", error);
		return NextResponse.json(
			{
				error: "Failed to update content source",
				details:
					error instanceof Error ? error.message : String(error),
			},
			{ status: 500 },
		);
	}
}

export async function DELETE(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { id } = await params;
		const existing = await getContentSourceById({ id });

		if (!existing) {
			return NextResponse.json(
				{ error: "Content source not found" },
				{ status: 404 },
			);
		}

		if (existing.userId !== userId) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		await deleteContentSource({ id });
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Failed to delete content source:", error);
		return NextResponse.json(
			{
				error: "Failed to delete content source",
				details:
					error instanceof Error ? error.message : String(error),
			},
			{ status: 500 },
		);
	}
}
