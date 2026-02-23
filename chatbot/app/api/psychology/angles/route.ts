import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
	getContentAngles,
	saveContentAngle,
	selectContentAngle,
	getCreatorProfile,
	getCustomerPersonas,
} from "@/lib/db/queries";
import { seoApi } from "@/lib/seo-api-client";

export async function POST(request: NextRequest) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { projectId, personaId, contentType, count } = body;

		const profile = await getCreatorProfile({ userId, projectId });
		if (!profile) {
			return NextResponse.json(
				{ error: "No creator profile found. Complete the ritual first." },
				{ status: 400 },
			);
		}

		const personas = await getCustomerPersonas({ userId, projectId });
		const persona = personas.find((p) => p.id === personaId);
		if (!persona) {
			return NextResponse.json(
				{ error: "Persona not found" },
				{ status: 404 },
			);
		}

		const result = await seoApi.generateAngles({
			profileId: profile.id,
			personaId: persona.id,
			creatorVoice: (profile.voice || {}) as Record<string, unknown>,
			creatorPositioning: (profile.positioning || {}) as Record<string, unknown>,
			narrativeSummary: undefined,
			personaData: {
				name: persona.name,
				painPoints: persona.painPoints,
				goals: persona.goals,
				language: persona.language,
				contentPreferences: persona.contentPreferences,
			} as Record<string, unknown>,
			contentType,
			count: count || 5,
		});

		return NextResponse.json(result);
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to generate angles" },
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
		const personaId = request.nextUrl.searchParams.get("personaId") || undefined;
		const status = request.nextUrl.searchParams.get("status") as any;
		const taskId = request.nextUrl.searchParams.get("taskId");

		// If polling for task status
		if (taskId) {
			const result = await seoApi.getAnglesStatus(taskId);
			return NextResponse.json(result);
		}

		const angles = await getContentAngles({
			userId,
			projectId,
			personaId,
			status: status || undefined,
		});
		return NextResponse.json(angles);
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to fetch angles" },
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
		const { id, status } = body;

		if (!id || !status) {
			return NextResponse.json(
				{ error: "Missing id or status" },
				{ status: 400 },
			);
		}

		const angle = await selectContentAngle({ id, status });
		return NextResponse.json(angle);
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to update angle" },
			{ status: 500 },
		);
	}
}
