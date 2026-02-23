import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
	createContentSource,
	ensureUser,
	getContentSourcesByUserId,
} from "@/lib/db/queries";

export async function GET(request: NextRequest) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { searchParams } = new URL(request.url);
		const projectId = searchParams.get("projectId") || undefined;

		const sources = await getContentSourcesByUserId({ userId, projectId });
		return NextResponse.json(sources);
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to fetch content sources" },
			{ status: 500 },
		);
	}
}

export async function POST(request: NextRequest) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const body = await request.json();
		const {
			projectId,
			name,
			repoOwner,
			repoName,
			basePath,
			filePattern,
			templateId,
			defaultBranch,
			metadata,
		} = body;

		if (!projectId || !name || !repoOwner || !repoName || !basePath) {
			return NextResponse.json(
				{
					error:
						"projectId, name, repoOwner, repoName, and basePath are required",
				},
				{ status: 400 },
			);
		}

		await ensureUser({ userId });

		const source = await createContentSource({
			userId,
			projectId,
			name,
			repoOwner,
			repoName,
			basePath,
			filePattern,
			templateId,
			defaultBranch,
			metadata,
		});

		return NextResponse.json(source, { status: 201 });
	} catch (error) {
		console.error("Failed to create content source:", error);
		return NextResponse.json(
			{
				error: "Failed to create content source",
				details:
					error instanceof Error ? error.message : String(error),
			},
			{ status: 500 },
		);
	}
}
