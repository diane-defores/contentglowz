import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
	getCustomerPersonas,
	saveCustomerPersona,
	deleteCustomerPersona,
} from "@/lib/db/queries";

export async function GET(request: NextRequest) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const projectId = request.nextUrl.searchParams.get("projectId") || undefined;
		const personas = await getCustomerPersonas({ userId, projectId });
		return NextResponse.json(personas);
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to fetch personas" },
			{ status: 500 },
		);
	}
}

export async function POST(request: NextRequest) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const body = await request.json();
		const persona = await saveCustomerPersona({
			userId,
			projectId: body.projectId,
			name: body.name,
			avatar: body.avatar,
			demographics: body.demographics,
			painPoints: body.painPoints,
			goals: body.goals,
			language: body.language,
			contentPreferences: body.contentPreferences,
			confidence: body.confidence,
		});
		return NextResponse.json(persona);
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to create persona" },
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
		if (!body.id) {
			return NextResponse.json({ error: "Missing persona id" }, { status: 400 });
		}
		const persona = await saveCustomerPersona({
			id: body.id,
			userId,
			projectId: body.projectId,
			name: body.name,
			avatar: body.avatar,
			demographics: body.demographics,
			painPoints: body.painPoints,
			goals: body.goals,
			language: body.language,
			contentPreferences: body.contentPreferences,
			confidence: body.confidence,
		});
		return NextResponse.json(persona);
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to update persona" },
			{ status: 500 },
		);
	}
}

export async function DELETE(request: NextRequest) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const id = request.nextUrl.searchParams.get("id");
		if (!id) {
			return NextResponse.json({ error: "Missing persona id" }, { status: 400 });
		}
		await deleteCustomerPersona({ id });
		return NextResponse.json({ success: true });
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to delete persona" },
			{ status: 500 },
		);
	}
}
