import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getGmailTokenByUserId } from "@/lib/db/queries";

export async function GET() {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const token = await getGmailTokenByUserId({ userId });

	if (token) {
		return NextResponse.json({
			connected: true,
			email: token.email,
		});
	}

	return NextResponse.json({ connected: false });
}
