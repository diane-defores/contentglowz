import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
	getCreatorProfile,
	upsertCreatorProfile,
	saveCreatorEntry,
	getCreatorEntries,
	getNarrativeUpdates,
	saveNarrativeUpdate,
	reviewNarrativeUpdate,
} from "@/lib/db/queries";
import { seoApi } from "@/lib/seo-api-client";

export async function POST(request: NextRequest) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { projectId, entryType, content, tags, triggerSynthesis } = body;

		// Ensure profile exists
		const profile = await upsertCreatorProfile({ userId, projectId });

		// Save the entry
		const entry = await saveCreatorEntry({
			profileId: profile.id,
			chapterId: profile.currentChapterId || undefined,
			entryType,
			content,
			tags,
		});

		let synthesisTaskId: string | null = null;

		// Optionally trigger synthesis
		if (triggerSynthesis) {
			const entries = await getCreatorEntries({ profileId: profile.id, limit: 10 });
			try {
				const result = await seoApi.synthesizeNarrative({
					profileId: profile.id,
					entryIds: entries.map((e) => e.id),
					currentVoice: profile.voice as Record<string, unknown> | undefined,
					currentPositioning: profile.positioning as Record<string, unknown> | undefined,
					chapterTitle: undefined,
				});
				synthesisTaskId = result.task_id;
			} catch {
				// Non-blocking: synthesis failure shouldn't block entry save
			}
		}

		return NextResponse.json({ entry, synthesisTaskId });
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to save entry" },
			{ status: 500 },
		);
	}
}

export async function GET(request: NextRequest) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const projectId = request.nextUrl.searchParams.get("projectId") || undefined;
		const status = request.nextUrl.searchParams.get("status") as "pending" | "approved" | "rejected" | undefined;

		const profile = await getCreatorProfile({ userId, projectId });
		if (!profile) {
			return NextResponse.json({ entries: [], updates: [] });
		}

		const entries = await getCreatorEntries({ profileId: profile.id });
		const updates = await getNarrativeUpdates({
			profileId: profile.id,
			status: status || undefined,
		});

		return NextResponse.json({ entries, updates });
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to fetch narrative data" },
			{ status: 500 },
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
		const { updateId, approved } = body;

		const update = await reviewNarrativeUpdate({
			id: updateId,
			status: approved ? "approved" : "rejected",
		});

		// If approved, merge deltas into profile
		if (approved && update.voiceDelta) {
			const projectId = new URL(request.url).searchParams.get("projectId") || undefined;
			const profile = await getCreatorProfile({ userId, projectId });
			if (profile) {
				const mergedVoice = { ...(profile.voice || {}), ...update.voiceDelta };
				const mergedPositioning = { ...(profile.positioning || {}), ...(update.positioningDelta || {}) };
				await upsertCreatorProfile({
					userId,
					projectId,
					voice: mergedVoice as any,
					positioning: mergedPositioning as any,
				});
			}
		}

		return NextResponse.json(update);
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to review narrative update" },
			{ status: 500 },
		);
	}
}
