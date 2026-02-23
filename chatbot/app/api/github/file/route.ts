import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOctokit, readFileContent, writeFileContent } from "@/lib/github";

export async function GET(request: NextRequest) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { searchParams } = new URL(request.url);
	const owner = searchParams.get("owner");
	const repo = searchParams.get("repo");
	const path = searchParams.get("path");
	const ref = searchParams.get("ref") || undefined;

	if (!owner || !repo || !path) {
		return NextResponse.json(
			{ error: "owner, repo, and path are required" },
			{ status: 400 },
		);
	}

	try {
		const octokit = await getOctokit(userId);
		if (!octokit) {
			return NextResponse.json(
				{ error: "GitHub not connected" },
				{ status: 401 },
			);
		}

		const file = await readFileContent(octokit, owner, repo, path, ref);
		return NextResponse.json(file);
	} catch (error: any) {
		const status = error?.status || 500;
		if (status === 404) {
			return NextResponse.json(
				{ error: "File not found" },
				{ status: 404 },
			);
		}
		console.error("GitHub file read error:", error);
		return NextResponse.json(
			{ error: "Failed to read file" },
			{ status: 500 },
		);
	}
}

export async function PUT(request: NextRequest) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { owner, repo, path, content, sha, message, branch } = body;

		if (!owner || !repo || !path || content === undefined || !sha || !message) {
			return NextResponse.json(
				{ error: "owner, repo, path, content, sha, and message are required" },
				{ status: 400 },
			);
		}

		const octokit = await getOctokit(userId);
		if (!octokit) {
			return NextResponse.json(
				{ error: "GitHub not connected" },
				{ status: 401 },
			);
		}

		const result = await writeFileContent(
			octokit,
			owner,
			repo,
			path,
			content,
			message,
			sha,
			branch,
		);

		return NextResponse.json(result);
	} catch (error: any) {
		const status = error?.status || 500;
		if (status === 409) {
			return NextResponse.json(
				{ error: "File was modified externally. Please reload and try again." },
				{ status: 409 },
			);
		}
		if (status === 422) {
			return NextResponse.json(
				{ error: "SHA mismatch — file was modified externally." },
				{ status: 409 },
			);
		}
		console.error("GitHub file write error:", error);
		return NextResponse.json(
			{ error: "Failed to save file" },
			{ status: 500 },
		);
	}
}
