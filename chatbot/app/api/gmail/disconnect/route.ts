import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { deleteGmailToken } from "@/lib/db/queries";

export async function POST() {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	await deleteGmailToken({ userId });

	return NextResponse.json({ success: true });
}
