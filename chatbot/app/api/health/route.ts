import { NextResponse } from "next/server";
import { getDbInfo } from "@/lib/db/client";

interface ServiceStatus {
	name: string;
	status: "ok" | "error" | "warning";
	message?: string;
	latency?: number;
}

async function checkService(
	name: string,
	checkFn: () => Promise<{ ok: boolean; message?: string }>
): Promise<ServiceStatus> {
	const start = Date.now();
	try {
		const result = await checkFn();
		return {
			name,
			status: result.ok ? "ok" : "error",
			message: result.message,
			latency: Date.now() - start,
		};
	} catch (error) {
		return {
			name,
			status: "error",
			message: error instanceof Error ? error.message : "Unknown error",
			latency: Date.now() - start,
		};
	}
}

export async function GET() {
	const services: ServiceStatus[] = [];

	// Check Turso database
	const dbInfo = getDbInfo();
	services.push({
		name: "Database (Turso)",
		status: dbInfo.connected ? "ok" : "error",
		message: dbInfo.connected ? "Connected" : "Not connected",
	});

	// Check SEO API (robots)
	const seoApiUrl = process.env.SEO_API_URL || "http://localhost:8000";
	services.push(
		await checkService("SEO Robots", async () => {
			try {
				const response = await fetch(`${seoApiUrl}/health`, {
					signal: AbortSignal.timeout(5000),
				});
				return { ok: response.ok, message: response.ok ? "Running" : `HTTP ${response.status}` };
			} catch {
				return { ok: false, message: "Not running (start with: python -m agents)" };
			}
		})
	);

	// Check configured API keys
	const apiKeys = {
		openai: !!process.env.OPENAI_API_KEY,
		anthropic: !!process.env.ANTHROPIC_API_KEY,
	};
	const configuredKeys = Object.entries(apiKeys).filter(([, v]) => v).map(([k]) => k);

	services.push({
		name: "LLM API Keys",
		status: configuredKeys.length > 0 ? "ok" : "warning",
		message: configuredKeys.length > 0 ? configuredKeys.join(", ") : "None configured",
	});

	const hasError = services.some((s) => s.status === "error");
	const hasWarning = services.some((s) => s.status === "warning");

	return NextResponse.json({
		status: hasError ? "unhealthy" : hasWarning ? "degraded" : "healthy",
		timestamp: new Date().toISOString(),
		services,
	}, { status: hasError ? 503 : 200 });
}
