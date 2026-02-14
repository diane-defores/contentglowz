import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserSettings, updateUserSettings } from "@/lib/db/queries";

export async function GET() {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const settings = await getUserSettings({ userId });

		// Don't expose full API keys, just indicate if they're set
		const safeSettings = {
			...settings,
			apiKeys: settings.apiKeys ? {
				exa: settings.apiKeys.exa ? "••••••••" : null,
				firecrawl: settings.apiKeys.firecrawl ? "••••••••" : null,
				serper: settings.apiKeys.serper ? "••••••••" : null,
				openrouter: settings.apiKeys.openrouter ? "••••••••" : null,
			} : null,
		};

		return NextResponse.json(safeSettings);
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to fetch settings" },
			{ status: 500 }
		);
	}
}

export async function PUT(request: NextRequest) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const body = await request.json();

		// Don't allow updating apiKeys through this endpoint
		// Use /api/settings/api-keys instead for security
		const { apiKeys, ...safeUpdates } = body;

		const updated = await updateUserSettings({
			userId,
			...safeUpdates,
		});

		// Don't expose API keys in response
		const safeSettings = {
			...updated,
			apiKeys: updated.apiKeys ? {
				exa: updated.apiKeys.exa ? "••••••••" : null,
				firecrawl: updated.apiKeys.firecrawl ? "••••••••" : null,
				serper: updated.apiKeys.serper ? "••••••••" : null,
				openrouter: updated.apiKeys.openrouter ? "••••••••" : null,
			} : null,
		};

		return NextResponse.json(safeSettings);
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to update settings" },
			{ status: 500 }
		);
	}
}
