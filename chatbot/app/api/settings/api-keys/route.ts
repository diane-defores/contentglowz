"use server";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { updateUserApiKey } from "@/lib/db/queries";

const VALID_PROVIDERS = ["openai", "anthropic", "exa", "firecrawl", "serper"] as const;
type Provider = (typeof VALID_PROVIDERS)[number];

export async function PUT(request: NextRequest) {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { provider, apiKey } = body;

		// Validate provider
		if (!provider || !VALID_PROVIDERS.includes(provider)) {
			return NextResponse.json(
				{ error: "Invalid provider. Must be one of: " + VALID_PROVIDERS.join(", ") },
				{ status: 400 }
			);
		}

		// Validate apiKey (must be string or null)
		if (apiKey !== null && typeof apiKey !== "string") {
			return NextResponse.json(
				{ error: "API key must be a string or null" },
				{ status: 400 }
			);
		}

		// Don't allow empty strings - treat as null
		const sanitizedKey = apiKey?.trim() || null;

		const updated = await updateUserApiKey({
			userId: session.user.id,
			provider: provider as Provider,
			apiKey: sanitizedKey,
		});

		// Don't expose full API keys in response
		const safeSettings = {
			...updated,
			apiKeys: updated.apiKeys
				? {
						openai: updated.apiKeys.openai ? "••••••••" : null,
						anthropic: updated.apiKeys.anthropic ? "••••••••" : null,
						exa: updated.apiKeys.exa ? "••••••••" : null,
						firecrawl: updated.apiKeys.firecrawl ? "••••••••" : null,
						serper: updated.apiKeys.serper ? "••••••••" : null,
					}
				: null,
		};

		return NextResponse.json(safeSettings);
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to update API key" },
			{ status: 500 }
		);
	}
}
