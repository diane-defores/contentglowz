import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { updateUserApiKey } from "@/lib/db/queries";

const VALID_PROVIDERS = ["exa", "firecrawl", "serper", "openrouter", "bunnyStorage", "bunnyCdn", "bunnyCdnHostname", "consensus", "tavily", "groq", "posthog", "posthogHost"] as const;
type Provider = (typeof VALID_PROVIDERS)[number];

export async function PUT(request: NextRequest) {
	const { userId } = await auth();
	if (!userId) {
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
			userId,
			provider: provider as Provider,
			apiKey: sanitizedKey,
		});

		// Don't expose full API keys in response
		const safeSettings = {
			...updated,
			apiKeys: updated.apiKeys
				? {
						exa: updated.apiKeys.exa ? "••••••••" : null,
						firecrawl: updated.apiKeys.firecrawl ? "••••••••" : null,
						serper: updated.apiKeys.serper ? "••••••••" : null,
						openrouter: updated.apiKeys.openrouter ? "••••••••" : null,
						bunnyStorage: updated.apiKeys.bunnyStorage ? "••••••••" : null,
						bunnyCdn: updated.apiKeys.bunnyCdn ? "••••••••" : null,
						bunnyCdnHostname: updated.apiKeys.bunnyCdnHostname ? "••••••••" : null,
						consensus: updated.apiKeys.consensus ? "••••••••" : null,
						tavily: updated.apiKeys.tavily ? "••••••••" : null,
						groq: updated.apiKeys.groq ? "••••••••" : null,
						posthog: updated.apiKeys.posthog ? "••••••••" : null,
						posthogHost: updated.apiKeys.posthogHost || null,
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
