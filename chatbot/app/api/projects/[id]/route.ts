import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { deleteProject, getProjectById, updateProject } from "@/lib/db/queries";

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { id } = await params;
		const project = await getProjectById({ id });

		if (!project) {
			return NextResponse.json({ error: "Project not found" }, { status: 404 });
		}

		// Verify ownership
		if (project.userId !== userId) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		return NextResponse.json(project);
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to fetch project" },
			{ status: 500 }
		);
	}
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { id } = await params;
		const existing = await getProjectById({ id });

		if (!existing) {
			return NextResponse.json({ error: "Project not found" }, { status: 404 });
		}

		if (existing.userId !== userId) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const body = await request.json();
		const updated = await updateProject({
			id,
			...body,
		});

		return NextResponse.json(updated);
	} catch (error) {
		console.error("Failed to update project:", error);
		return NextResponse.json(
			{ error: "Failed to update project", details: error instanceof Error ? error.message : String(error) },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { id } = await params;
		const existing = await getProjectById({ id });

		if (!existing) {
			return NextResponse.json({ error: "Project not found" }, { status: 404 });
		}

		if (existing.userId !== userId) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		await deleteProject({ id });
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Failed to delete project:", error);
		return NextResponse.json(
			{ error: "Failed to delete project", details: error instanceof Error ? error.message : String(error) },
			{ status: 500 }
		);
	}
}
