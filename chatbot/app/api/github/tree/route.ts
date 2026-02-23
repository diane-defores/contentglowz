import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
	filterContentEntries,
	getOctokit,
	listRepoContents,
} from "@/lib/github";

export async function GET(request: NextRequest) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { searchParams } = new URL(request.url);
	const owner = searchParams.get("owner");
	const repo = searchParams.get("repo");
	const path = searchParams.get("path") || "";
	const filter = searchParams.get("filter");
	const ref = searchParams.get("ref") || undefined;

	if (!owner || !repo) {
		return NextResponse.json(
			{ error: "owner and repo are required" },
			{ status: 400 },
		);
	}

	try {
		const octokit = await getOctokit(userId);
		if (!octokit) {
			return NextResponse.json(
				{ error: "GitHub not connected. Please connect GitHub in your profile." },
				{ status: 401 },
			);
		}

		// Debug: log authenticated user + scopes to verify token works
		try {
			const { data: ghUser } = await octokit.users.getAuthenticated();
			const { headers } = await octokit.request("HEAD /");
			console.log(`[github/tree] Authenticated as: ${ghUser.login}, scopes: ${headers["x-oauth-scopes"]}, requesting: ${owner}/${repo}/${path}`);
		} catch (debugErr) {
			console.warn("[github/tree] Debug auth check failed:", debugErr);
		}

		let entries = await listRepoContents(octokit, owner, repo, path, ref);

		if (filter === "markdown" || filter === "content") {
			entries = filterContentEntries(entries);
		}

		return NextResponse.json(entries);
	} catch (error: any) {
		const status = error?.status || 500;
		const repoRef = `${owner}/${repo}${path ? `/${path}` : ""}`;
		console.error(`GitHub tree error for ${repoRef}:`, error?.message || error);

		if (status === 404) {
			return NextResponse.json(
				{
					error: `Could not find "${repoRef}". Check that the repository exists and your GitHub account has access to it. For private repos, make sure the "repo" scope is enabled in Clerk's GitHub OAuth settings.`,
				},
				{ status: 404 },
			);
		}
		if (status === 403) {
			return NextResponse.json(
				{
					error: `Access denied for "${repoRef}". Your GitHub token may lack the required scopes. Ensure the "repo" scope is enabled in Clerk's GitHub OAuth configuration.`,
				},
				{ status: 403 },
			);
		}
		if (status === 429) {
			return NextResponse.json(
				{ error: "GitHub API rate limit exceeded. Try again in a few minutes." },
				{ status: 429 },
			);
		}
		return NextResponse.json(
			{ error: "Failed to fetch repository contents. Please try again." },
			{ status: 500 },
		);
	}
}
