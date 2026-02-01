import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { createProject, getProjectsByUserId } from "@/lib/db/queries";

export async function GET() {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const projects = await getProjectsByUserId({ userId: session.user.id });
		return NextResponse.json(projects);
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to fetch projects" },
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { name, url, type, description, isDefault, settings } = body;

		if (!name || !url) {
			return NextResponse.json(
				{ error: "Name and URL are required" },
				{ status: 400 }
			);
		}

		const project = await createProject({
			userId: session.user.id,
			name,
			url,
			type,
			description,
			isDefault,
			settings,
		});

		return NextResponse.json(project, { status: 201 });
	} catch (error) {
		console.error("Failed to create project:", error);
		return NextResponse.json(
			{ error: "Failed to create project", details: error instanceof Error ? error.message : String(error) },
			{ status: 500 }
		);
	}
}
