import { type NextRequest, NextResponse } from "next/server";

const API_URL = process.env.SEO_API_URL || "https://bizflowz-api.onrender.com";

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
				error:
					"Failed to connect to SEO API. It may be starting up (30-60s on free tier).",
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
				error:
					"Failed to connect to SEO API. It may be starting up (30-60s on free tier).",
			},
			{ status: 503 },
		);
	}
}
