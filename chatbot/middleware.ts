import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
	"/login(.*)",
	"/register(.*)",
	"/ping",
	"/api/seo(.*)",
	"/api/gmail/callback",
	"/api/webhooks(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
	if (!isPublicRoute(req)) {
		await auth.protect();
	}
});

export const config = {
	matcher: [
		"/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
		"/(api|trpc)(.*)",
	],
};
