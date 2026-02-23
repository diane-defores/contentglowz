/**
 * Client-side GitHub URL parser (lib/github.ts is server-only).
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
