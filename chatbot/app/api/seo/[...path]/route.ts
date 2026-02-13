import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Resolve the Python API URL dynamically:
 * 1. SEO_API_URL env var (explicit override)
 * 2. Read port from ecosystem.config.cjs (PM2 source of truth)
 * 3. Fallback to port 8000
 */
function getApiUrl(): string {
	if (process.env.SEO_API_URL) return process.env.SEO_API_URL;

	try {
		const ecoPath = resolve(process.cwd(), "../ecosystem.config.cjs");
		const content = readFileSync(ecoPath, "utf-8");
		const portMatch = content.match(/PORT[:\s]*(\d+)/);
		if (portMatch) return `http://localhost:${portMatch[1]}`;
	} catch {
		// ecosystem.config.cjs not found — use fallback
	}

	return "http://localhost:8000";
}

const API_URL = getApiUrl();

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ path: string[] }> },
) {
	const { path } = await params;
	const url = `${API_URL}/${path.join("/")}`;

	try {
		const response = await fetch(url, {
			headers: {
				"Content-Type": "application/json",
			},
			cache: "no-store",
		});

		if (!response.ok) {
			const error = await response.text();
			return NextResponse.json(
				{ error: error || response.statusText },
				{ status: response.status },
			);
		}

		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("SEO API proxy error:", error);
		return NextResponse.json(
			{
				error: `Failed to connect to SEO API at ${API_URL}. Start robots with: python -m agents`,
			},
			{ status: 503 },
		);
	}
}

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ path: string[] }> },
) {
	const { path } = await params;
	const url = `${API_URL}/${path.join("/")}`;

	try {
		const body = await request.json();

		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
			cache: "no-store",
		});

		if (!response.ok) {
			const error = await response.text();
			return NextResponse.json(
				{ error: error || response.statusText },
				{ status: response.status },
			);
		}

		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("SEO API proxy error:", error);
		return NextResponse.json(
			{
				error: `Failed to connect to SEO API at ${API_URL}. Start robots with: python -m agents`,
			},
			{ status: 503 },
		);
	}
}
