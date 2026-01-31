"use server";

import { NextResponse } from "next/server";
import { getDbInfo } from "@/lib/db/client";

interface ServiceStatus {
	name: string;
	status: "ok" | "error" | "warning";
	message?: string;
	latency?: number;
}

interface HealthResponse {
	status: "healthy" | "degraded" | "unhealthy";
	timestamp: string;
	environment: "local" | "production";
	services: ServiceStatus[];
}

async function checkService(
	name: string,
	checkFn: () => Promise<{ ok: boolean; message?: string }>
): Promise<ServiceStatus> {
	const start = Date.now();
	try {
		const result = await checkFn();
		const latency = Date.now() - start;
		return {
			name,
			status: result.ok ? "ok" : "error",
			message: result.message,
			latency,
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

	// Check database
	const dbInfo = getDbInfo();
	services.push({
		name: `Database (${dbInfo.type})`,
		status: dbInfo.connected ? "ok" : "error",
		message: dbInfo.connected
			? `Connected to ${dbInfo.type === "local" ? "local SQLite" : "Turso"}`
			: "Not connected",
	});

	// Check SEO API (local or remote)
	const seoApiUrl = process.env.SEO_API_URL || "http://localhost:8000";
	services.push(
		await checkService("SEO API", async () => {
			try {
				const response = await fetch(`${seoApiUrl}/health`, {
					signal: AbortSignal.timeout(5000),
				});
				return {
					ok: response.ok,
					message: response.ok ? `Running at ${seoApiUrl}` : `HTTP ${response.status}`,
				};
			} catch {
				return { ok: false, message: `Not reachable at ${seoApiUrl}` };
			}
		})
	);

	// Check Render API (if configured)
	if (process.env.RENDER_API_URL) {
		services.push(
			await checkService("Render API", async () => {
				try {
					const response = await fetch(`${process.env.RENDER_API_URL}/health`, {
						signal: AbortSignal.timeout(5000),
					});
					return { ok: response.ok, message: response.ok ? "Online" : `HTTP ${response.status}` };
				} catch {
					return { ok: false, message: "Not reachable" };
				}
			})
		);
	}

	// Check if API keys are configured
	const apiKeys = {
		openai: !!process.env.OPENAI_API_KEY,
		anthropic: !!process.env.ANTHROPIC_API_KEY,
		exa: !!process.env.EXA_API_KEY,
		firecrawl: !!process.env.FIRECRAWL_API_KEY,
		serper: !!process.env.SERPER_API_KEY,
	};

	const configuredKeys = Object.entries(apiKeys)
		.filter(([, configured]) => configured)
		.map(([name]) => name);

	services.push({
		name: "API Keys",
		status: configuredKeys.length > 0 ? "ok" : "warning",
		message:
			configuredKeys.length > 0
				? `Configured: ${configuredKeys.join(", ")}`
				: "No API keys configured",
	});

	// Determine overall status
	const hasError = services.some((s) => s.status === "error");
	const hasWarning = services.some((s) => s.status === "warning");

	const response: HealthResponse = {
		status: hasError ? "unhealthy" : hasWarning ? "degraded" : "healthy",
		timestamp: new Date().toISOString(),
		environment: dbInfo.type === "local" ? "local" : "production",
		services,
	};

	return NextResponse.json(response, {
		status: hasError ? 503 : 200,
	});
}
