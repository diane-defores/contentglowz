import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
	const { userId } = await auth();

	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const url = request.nextUrl.searchParams.get("url");

	if (!url) {
		return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
	}

	let parsedUrl: URL;
	try {
		parsedUrl = new URL(url);
	} catch {
		return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
	}

	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 5000);

		const response = await fetch(parsedUrl.toString(), {
			signal: controller.signal,
			headers: {
				"User-Agent": "Mozilla/5.0 (compatible; CompetitorBot/1.0)",
			},
		});

		clearTimeout(timeoutId);

		if (!response.ok) {
			return NextResponse.json({ name: null, niche: null });
		}

		const html = await response.text();

		const name = extractName(html, parsedUrl);
		const niche = extractNiche(html);

		return NextResponse.json({ name, niche });
	} catch {
		// Network error, timeout, etc. — return gracefully
		return NextResponse.json({ name: null, niche: null });
	}
}

function extractName(html: string, url: URL): string | null {
	// Try og:title first
	const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1]
		|| html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i)?.[1];

	if (ogTitle) return ogTitle.trim().substring(0, 100);

	// Then <title>
	const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
	if (title) {
		// Remove common suffixes like " | Site Name" or " - Site Name"
		const cleaned = title.replace(/\s*[\|–—-]\s*.+$/, "").trim();
		if (cleaned) return cleaned.substring(0, 100);
	}

	// Fallback to hostname
	return url.hostname.replace(/^www\./, "");
}

function extractNiche(html: string): string | null {
	// Try og:description
	const ogDesc = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1]
		|| html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i)?.[1];

	if (ogDesc) return ogDesc.trim().substring(0, 150);

	// Then meta description
	const metaDesc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1]
		|| html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i)?.[1];

	if (metaDesc) return metaDesc.trim().substring(0, 150);

	return null;
}
