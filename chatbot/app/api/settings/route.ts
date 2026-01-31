"use server";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getUserSettings, updateUserSettings } from "@/lib/db/queries";

export async function GET() {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const settings = await getUserSettings({ userId: session.user.id });

		// Don't expose full API keys, just indicate if they're set
		const safeSettings = {
			...settings,
			apiKeys: settings.apiKeys ? {
				openai: settings.apiKeys.openai ? "••••••••" : null,
				anthropic: settings.apiKeys.anthropic ? "••••••••" : null,
				exa: settings.apiKeys.exa ? "••••••••" : null,
				firecrawl: settings.apiKeys.firecrawl ? "••••••••" : null,
				serper: settings.apiKeys.serper ? "••••••••" : null,
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
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const body = await request.json();

		// Don't allow updating apiKeys through this endpoint
		// Use /api/settings/api-keys instead for security
		const { apiKeys, ...safeUpdates } = body;

		const updated = await updateUserSettings({
			userId: session.user.id,
			...safeUpdates,
		});

		// Don't expose API keys in response
		const safeSettings = {
			...updated,
			apiKeys: updated.apiKeys ? {
				openai: updated.apiKeys.openai ? "••••••••" : null,
				anthropic: updated.apiKeys.anthropic ? "••••••••" : null,
				exa: updated.apiKeys.exa ? "••••••••" : null,
				firecrawl: updated.apiKeys.firecrawl ? "••••••••" : null,
				serper: updated.apiKeys.serper ? "••••••••" : null,
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
