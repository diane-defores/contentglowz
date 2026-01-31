"use server";

import { NextRequest, NextResponse } from "next/server";

// Proxy for external health checks to avoid CORS issues
export async function GET(request: NextRequest) {
	const url = request.nextUrl.searchParams.get("url");

	if (!url) {
		return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
	}

	// Whitelist of allowed domains for security
	const allowedDomains = [
		"bizflowz-api.onrender.com",
		"localhost",
		"127.0.0.1",
	];

	try {
		const parsedUrl = new URL(url);
		const isAllowed = allowedDomains.some(
			(domain) => parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
		);

		if (!isAllowed) {
			return NextResponse.json(
				{ error: "Domain not allowed" },
				{ status: 403 }
			);
		}

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 10000);

		const startTime = Date.now();
		const response = await fetch(url, {
			method: "GET",
			signal: controller.signal,
			headers: {
				"User-Agent": "UptimeMonitor/1.0",
			},
		});

		clearTimeout(timeoutId);
		const responseTime = Date.now() - startTime;

		let body = null;
		const contentType = response.headers.get("content-type");
		if (contentType?.includes("application/json")) {
			try {
				body = await response.json();
			} catch {
				body = null;
			}
		}

		return NextResponse.json({
			status: response.status,
			ok: response.ok,
			responseTime,
			body,
		});
	} catch (error) {
		return NextResponse.json(
			{
				status: 0,
				ok: false,
				error: error instanceof Error ? error.message : "Connection failed",
			},
			{ status: 200 } // Return 200 so client can read the error
		);
	}
}
