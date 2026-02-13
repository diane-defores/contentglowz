import { auth as clerkAuth, currentUser } from "@clerk/nextjs/server";

export async function getAuthUserId(): Promise<string> {
	const { userId } = await clerkAuth();
	if (!userId) throw new Error("Unauthorized");
	return userId;
}

export { currentUser };
