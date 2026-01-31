"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface ServiceStatus {
	id: string;
	name: string;
	url: string;
	status: "online" | "offline" | "degraded" | "checking";
	responseTime?: number;
	lastChecked?: Date;
	uptime?: number; // percentage
	error?: string;
}

export interface UptimeHistory {
	timestamp: Date;
	services: Record<string, boolean>;
}

const DEFAULT_SERVICES: Omit<ServiceStatus, "status" | "responseTime" | "lastChecked">[] = [
	{
		id: "seo-api",
		name: "SEO API (Render)",
		url: "/api/seo/health",
	},
	{
		id: "chatbot",
		name: "Chatbot (Next.js)",
		url: "/api/chat",
	},
	{
		id: "database",
		name: "Database (Turso)",
		url: "/api/affiliations",
	},
];

const CHECK_INTERVAL_HEALTHY = 60000; // 1 minute when all healthy
const CHECK_INTERVAL_UNHEALTHY = 15000; // 15 seconds when something is down

export function useUptime() {
	const [services, setServices] = useState<ServiceStatus[]>(
		DEFAULT_SERVICES.map((s) => ({ ...s, status: "checking" as const })),
	);
	const [loading, setLoading] = useState(true);
	const [lastFullCheck, setLastFullCheck] = useState<Date | null>(null);
	const [history, setHistory] = useState<UptimeHistory[]>([]);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);

	const checkService = useCallback(
		async (service: Omit<ServiceStatus, "status" | "responseTime" | "lastChecked">): Promise<ServiceStatus> => {
			const startTime = Date.now();

			try {
				const controller = new AbortController();
				const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

				const response = await fetch(service.url, {
					method: service.url.includes("/api/chat") ? "GET" : "GET",
					signal: controller.signal,
					headers: {
						"Cache-Control": "no-cache",
					},
				});

				clearTimeout(timeoutId);
				const responseTime = Date.now() - startTime;

				// Consider degraded if response time > 5s
				const status: ServiceStatus["status"] =
					response.ok ? (responseTime > 5000 ? "degraded" : "online") : "offline";

				return {
					...service,
					status,
					responseTime,
					lastChecked: new Date(),
					error: response.ok ? undefined : `HTTP ${response.status}`,
				};
			} catch (err) {
				return {
					...service,
					status: "offline",
					responseTime: Date.now() - startTime,
					lastChecked: new Date(),
					error: err instanceof Error ? err.message : "Connection failed",
				};
			}
		},
		[],
	);

	const checkAllServices = useCallback(async () => {
		setLoading(true);

		const results = await Promise.all(
			DEFAULT_SERVICES.map((service) => checkService(service)),
		);

		// Calculate uptime percentages based on history
		const updatedResults = results.map((result) => {
			const serviceHistory = history
				.slice(-100) // Last 100 checks
				.map((h) => h.services[result.id])
				.filter((v) => v !== undefined);

			const uptime =
				serviceHistory.length > 0
					? (serviceHistory.filter(Boolean).length / serviceHistory.length) * 100
					: 100;

			return { ...result, uptime };
		});

		setServices(updatedResults);
		setLastFullCheck(new Date());

		// Add to history
		const historyEntry: UptimeHistory = {
			timestamp: new Date(),
			services: Object.fromEntries(
				results.map((r) => [r.id, r.status === "online"]),
			),
		};
		setHistory((prev) => [...prev.slice(-999), historyEntry]);

		setLoading(false);

		// Return overall health
		return results.every((r) => r.status === "online");
	}, [checkService, history]);

	const checkSingleService = useCallback(
		async (serviceId: string) => {
			const serviceConfig = DEFAULT_SERVICES.find((s) => s.id === serviceId);
			if (!serviceConfig) return;

			// Set to checking
			setServices((prev) =>
				prev.map((s) =>
					s.id === serviceId ? { ...s, status: "checking" as const } : s,
				),
			);

			const result = await checkService(serviceConfig);

			setServices((prev) =>
				prev.map((s) => (s.id === serviceId ? result : s)),
			);
		},
		[checkService],
	);

	// Auto-check with adaptive interval
	useEffect(() => {
		// Initial check
		checkAllServices();

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, []);

	// Set up interval based on health status
	useEffect(() => {
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
		}

		const allHealthy = services.every((s) => s.status === "online");
		const interval = allHealthy ? CHECK_INTERVAL_HEALTHY : CHECK_INTERVAL_UNHEALTHY;

		intervalRef.current = setInterval(() => {
			checkAllServices();
		}, interval);

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, [services, checkAllServices]);

	const overallStatus = services.every((s) => s.status === "online")
		? "operational"
		: services.some((s) => s.status === "online")
			? "degraded"
			: "outage";

	const averageResponseTime =
		services.filter((s) => s.responseTime !== undefined).length > 0
			? services.reduce((acc, s) => acc + (s.responseTime || 0), 0) /
				services.filter((s) => s.responseTime !== undefined).length
			: 0;

	return {
		services,
		loading,
		lastFullCheck,
		history,
		overallStatus,
		averageResponseTime,
		refresh: checkAllServices,
		checkService: checkSingleService,
	};
}
