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

interface ServiceConfig {
	id: string;
	name: string;
	url: string;
	isExternal?: boolean; // External URLs need to be proxied to avoid CORS
}

const DEFAULT_SERVICES: ServiceConfig[] = [
	{
		id: "system-health",
		name: "System Health",
		url: "/api/health",
	},
	{
		id: "database",
		name: "Database",
		url: "/api/affiliations",
	},
	{
		id: "seo-api",
		name: "SEO API",
		url: "/api/seo/health",
	},
	{
		id: "render-api",
		name: "Render API",
		url: "https://bizflowz-api.onrender.com/health",
		isExternal: true,
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
	const historyRef = useRef<UptimeHistory[]>([]); // Ref to avoid stale closure in callbacks

	const checkService = useCallback(
		async (service: ServiceConfig): Promise<ServiceStatus> => {
			const startTime = Date.now();

			try {
				const controller = new AbortController();
				const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

				// For external URLs, use the proxy to avoid CORS
				const fetchUrl = service.isExternal
					? `/api/health-check?url=${encodeURIComponent(service.url)}`
					: service.url;

				const response = await fetch(fetchUrl, {
					method: "GET",
					signal: controller.signal,
					headers: {
						"Cache-Control": "no-cache",
					},
				});

				clearTimeout(timeoutId);

				// For proxied requests, parse the response body
				if (service.isExternal && response.ok) {
					const data = await response.json();
					const responseTime = data.responseTime || (Date.now() - startTime);
					const status: ServiceStatus["status"] =
						data.ok ? (responseTime > 5000 ? "degraded" : "online") : "offline";

					return {
						id: service.id,
						name: service.name,
						url: service.url,
						status,
						responseTime,
						lastChecked: new Date(),
						error: data.ok ? undefined : data.error || `HTTP ${data.status}`,
					};
				}

				const responseTime = Date.now() - startTime;

				// Consider degraded if response time > 5s
				const status: ServiceStatus["status"] =
					response.ok ? (responseTime > 5000 ? "degraded" : "online") : "offline";

				return {
					id: service.id,
					name: service.name,
					url: service.url,
					status,
					responseTime,
					lastChecked: new Date(),
					error: response.ok ? undefined : `HTTP ${response.status}`,
				};
			} catch (err) {
				return {
					id: service.id,
					name: service.name,
					url: service.url,
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

		// Calculate uptime percentages based on history (use ref to avoid stale closure)
		const currentHistory = historyRef.current;
		const updatedResults = results.map((result) => {
			const serviceHistory = currentHistory
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
		setHistory((prev) => {
			const newHistory = [...prev.slice(-999), historyEntry];
			historyRef.current = newHistory; // Keep ref in sync
			return newHistory;
		});

		setLoading(false);

		// Return overall health
		return results.every((r) => r.status === "online");
	}, [checkService]);

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

			// Preserve uptime from previous state
			setServices((prev) =>
				prev.map((s) => (s.id === serviceId ? { ...result, uptime: s.uptime } : s)),
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
