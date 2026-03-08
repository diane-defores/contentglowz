import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOctokit } from "@/lib/github";

export async function GET() {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const octokit = await getOctokit(userId);
		if (!octokit) {
			return NextResponse.json(
				{ error: "GitHub not connected" },
				{ status: 403 },
			);
		}

		// Fetch repos the user has access to (owned + collaborator), sorted by most recently pushed
		const repos = await octokit.paginate(
			octokit.repos.listForAuthenticatedUser,
			{
				sort: "pushed",
				direction: "desc",
				per_page: 100,
			},
			(response) =>
				response.data.map((repo) => ({
					id: repo.id,
					name: repo.name,
					full_name: repo.full_name,
					html_url: repo.html_url,
					description: repo.description,
					private: repo.private,
					owner: repo.owner.login,
					default_branch: repo.default_branch,
					language: repo.language,
					updated_at: repo.updated_at,
					stargazers_count: repo.stargazers_count,
				})),
		);

		return NextResponse.json(repos);
	} catch (error) {
		console.error("GitHub repos error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch repositories" },
			{ status: 500 },
		);
	}
}
