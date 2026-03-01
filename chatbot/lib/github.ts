import "server-only";

import { clerkClient } from "@clerk/nextjs/server";
import { Octokit } from "@octokit/rest";

export interface GitHubTreeEntry {
	name: string;
	path: string;
	type: "file" | "dir";
	size?: number;
	sha: string;
}

/**
 * Parses a GitHub URL into owner/repo parts.
 * Supports: https://github.com/owner/repo, github.com/owner/repo, etc.
 */
export function parseGitHubUrl(
	url: string,
): { owner: string; repo: string } | null {
	try {
		const cleaned = url.replace(/\/+$/, "");
		const match = cleaned.match(
			/(?:https?:\/\/)?(?:www\.)?github\.com\/([^/]+)\/([^/]+)/,
		);
		if (!match) return null;
		return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
	} catch {
		return null;
	}
}

/**
 * Gets the GitHub OAuth access token for a user via Clerk.
 * Returns null if the user hasn't connected GitHub.
 */
export async function getGitHubToken(userId: string): Promise<string | null> {
	try {
		const client = await clerkClient();
		const tokens = await client.users.getUserOauthAccessToken(userId, "github");
		const token = tokens.data?.[0]?.token;
		return token || null;
	} catch {
		return null;
	}
}

/**
 * Creates an authenticated Octokit instance for a user.
 * Returns null if no GitHub token is available.
 */
export async function getOctokit(userId: string): Promise<Octokit | null> {
	const token = await getGitHubToken(userId);
	if (!token) return null;
	return new Octokit({ auth: token });
}

/**
 * Lists contents of a directory in a GitHub repo.
 * Returns entries sorted: directories first, then alphabetically.
 */
export async function listRepoContents(
	octokit: Octokit,
	owner: string,
	repo: string,
	path = "",
	ref?: string,
): Promise<GitHubTreeEntry[]> {
	const response = await octokit.repos.getContent({
		owner,
		repo,
		path,
		...(ref ? { ref } : {}),
	});

	if (!Array.isArray(response.data)) {
		return [];
	}

	const entries: GitHubTreeEntry[] = response.data.map((item) => ({
		name: item.name,
		path: item.path,
		type: item.type === "dir" ? "dir" : "file",
		size: item.size,
		sha: item.sha,
	}));

	return entries.sort((a, b) => {
		if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
		return a.name.localeCompare(b.name);
	});
}

/**
 * Filters entries to only include content files (.md, .mdx, .astro, .ts) and directories.
 */
export function filterContentEntries(
	entries: GitHubTreeEntry[],
): GitHubTreeEntry[] {
	return entries.filter(
		(e) =>
			e.type === "dir" ||
			e.name.endsWith(".md") ||
			e.name.endsWith(".mdx") ||
			e.name.endsWith(".astro") ||
			e.name.endsWith(".ts"),
	);
}

/**
 * Reads the content of a file from a GitHub repo.
 * Returns the decoded text content and the file's SHA (needed for updates).
 */
export async function readFileContent(
	octokit: Octokit,
	owner: string,
	repo: string,
	path: string,
	ref?: string,
): Promise<{ content: string; sha: string }> {
	const response = await octokit.repos.getContent({
		owner,
		repo,
		path,
		...(ref ? { ref } : {}),
	});

	if (Array.isArray(response.data) || response.data.type !== "file") {
		throw new Error(`Path "${path}" is not a file`);
	}

	const content = Buffer.from(response.data.content, "base64").toString(
		"utf-8",
	);
	return { content, sha: response.data.sha };
}

/**
 * Creates or updates a file in a GitHub repo (direct commit).
 * The SHA parameter is required for updates (prevents conflicts).
 */
export async function writeFileContent(
	octokit: Octokit,
	owner: string,
	repo: string,
	path: string,
	content: string,
	message: string,
	sha: string,
	branch?: string,
): Promise<{ sha: string; commitSha: string }> {
	const response = await octokit.repos.createOrUpdateFileContents({
		owner,
		repo,
		path,
		message,
		content: Buffer.from(content).toString("base64"),
		sha,
		...(branch ? { branch } : {}),
	});

	return {
		sha: response.data.content?.sha || "",
		commitSha: response.data.commit.sha || "",
	};
}

/**
 * Gets the default branch name for a repo.
 */
export async function getDefaultBranch(
	octokit: Octokit,
	owner: string,
	repo: string,
): Promise<string> {
	const response = await octokit.repos.get({ owner, repo });
	return response.data.default_branch;
}

/**
 * Lists files recursively using Git tree API, then filters by basePath and extensions.
 */
export async function listRepoFilesRecursive(
	octokit: Octokit,
	owner: string,
	repo: string,
	params: {
		basePath?: string;
		branch?: string;
		extensions?: string[];
		limit?: number;
	},
): Promise<string[]> {
	const branch =
		params.branch || (await getDefaultBranch(octokit, owner, repo));
	const ref = await octokit.git.getRef({
		owner,
		repo,
		ref: `heads/${branch}`,
	});

	const tree = await octokit.git.getTree({
		owner,
		repo,
		tree_sha: ref.data.object.sha,
		recursive: "true",
	});

	const normalizedBasePath = (params.basePath || "")
		.replace(/^\/+/, "")
		.replace(/\/+$/, "");

	const normalizedExtensions =
		params.extensions?.map((extension) =>
			extension.startsWith(".")
				? extension.toLowerCase()
				: `.${extension.toLowerCase()}`,
		) || [];

	const files: string[] = [];
	for (const item of tree.data.tree) {
		if (item.type !== "blob" || !item.path) {
			continue;
		}

		if (
			normalizedBasePath &&
			item.path !== normalizedBasePath &&
			!item.path.startsWith(`${normalizedBasePath}/`)
		) {
			continue;
		}

		if (
			normalizedExtensions.length > 0 &&
			!normalizedExtensions.some((extension) =>
				item.path?.toLowerCase().endsWith(extension),
			)
		) {
			continue;
		}

		files.push(item.path);
		if (params.limit && files.length >= params.limit) {
			break;
		}
	}

	return files;
}
