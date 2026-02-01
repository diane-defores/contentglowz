"use client";

import {
	Activity,
	AlertTriangle,
	CheckCircle,
	Clock,
	Loader2,
	RefreshCw,
	XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useUptime, type ServiceStatus } from "@/hooks/use-uptime";

function getStatusIcon(status: ServiceStatus["status"]) {
	switch (status) {
		case "online":
			return <CheckCircle className="h-5 w-5 text-green-500" />;
		case "degraded":
			return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
		case "offline":
			return <XCircle className="h-5 w-5 text-red-500" />;
		case "checking":
			return <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />;
		default:
			return <Activity className="h-5 w-5 text-muted-foreground" />;
	}
}

function getStatusBadge(status: ServiceStatus["status"]) {
	switch (status) {
		case "online":
			return <Badge className="bg-green-100 text-green-800">Online</Badge>;
		case "degraded":
			return <Badge className="bg-yellow-100 text-yellow-800">Degraded</Badge>;
		case "offline":
			return <Badge className="bg-red-100 text-red-800">Offline</Badge>;
		case "checking":
			return <Badge className="bg-gray-100 text-gray-800">Checking...</Badge>;
		default:
			return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
	}
}

function formatResponseTime(ms?: number) {
	if (ms === undefined) return "-";
	if (ms < 1000) return `${ms}ms`;
	return `${(ms / 1000).toFixed(2)}s`;
}

function getOverallStatusColor(status: string) {
	switch (status) {
		case "operational":
			return "text-green-600";
		case "degraded":
			return "text-yellow-600";
		case "outage":
			return "text-red-600";
		default:
			return "text-muted-foreground";
	}
}

function getOverallStatusLabel(status: string) {
	switch (status) {
		case "operational":
			return "All Systems Operational";
		case "degraded":
			return "Partial System Outage";
		case "outage":
			return "Major System Outage";
		default:
			return "Unknown Status";
	}
}

interface ServiceCardProps {
	service: ServiceStatus;
	onCheck: () => void;
}

function ServiceCard({ service, onCheck }: ServiceCardProps) {
	return (
		<Card className="p-4">
			<div className="flex items-start justify-between">
				<div className="flex items-center gap-3">
					{getStatusIcon(service.status)}
					<div>
						<h3 className="font-medium">{service.name}</h3>
						<p className="text-xs text-muted-foreground">{service.url}</p>
					</div>
				</div>
				{getStatusBadge(service.status)}
			</div>

			<div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-sm">
				<div>
					<p className="text-muted-foreground">Response Time</p>
					<p className="font-medium">{formatResponseTime(service.responseTime)}</p>
				</div>
				<div>
					<p className="text-muted-foreground">Uptime</p>
					<p className="font-medium">
						{service.uptime !== undefined ? `${service.uptime.toFixed(1)}%` : "-"}
					</p>
				</div>
				<div>
					<p className="text-muted-foreground">Last Check</p>
					<p className="font-medium">
						{service.lastChecked
							? new Date(service.lastChecked).toLocaleTimeString()
							: "-"}
					</p>
				</div>
			</div>

			{service.uptime !== undefined && (
				<div className="mt-3">
					<Progress
						value={service.uptime}
						className="h-2"
					/>
				</div>
			)}

			{service.error && (
				<div className="mt-3 p-2 bg-red-50 rounded text-xs text-red-600">
					Error: {service.error}
				</div>
			)}

			<div className="mt-4 flex justify-end">
				<Button
					onClick={onCheck}
					variant="outline"
					size="sm"
					disabled={service.status === "checking"}
				>
					{service.status === "checking" ? (
						<Loader2 className="mr-2 h-3 w-3 animate-spin" />
					) : (
						<RefreshCw className="mr-2 h-3 w-3" />
					)}
					Check Now
				</Button>
			</div>
		</Card>
	);
}

export function UptimeTab() {
	const {
		services,
		loading,
		lastFullCheck,
		overallStatus,
		averageResponseTime,
		refresh,
		checkService,
	} = useUptime();

	const onlineCount = services.filter((s) => s.status === "online").length;
	const offlineCount = services.filter((s) => s.status === "offline").length;
	const degradedCount = services.filter((s) => s.status === "degraded").length;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-xl font-semibold">Uptime Monitor</h2>
					<p className="text-sm text-muted-foreground">
						Real-time status of all services and APIs
					</p>
				</div>
				<div className="flex items-center gap-4">
					{lastFullCheck && (
						<span className="text-sm text-muted-foreground">
							<Clock className="inline h-4 w-4 mr-1" />
							Last check: {new Date(lastFullCheck).toLocaleTimeString()}
						</span>
					)}
					<Button onClick={refresh} variant="outline" size="sm" disabled={loading}>
						{loading ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<RefreshCw className="mr-2 h-4 w-4" />
						)}
						Refresh All
					</Button>
				</div>
			</div>

			{/* Overall Status Banner */}
			<Card className="p-4 sm:p-6">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<div className="flex items-center gap-3 sm:gap-4">
						{overallStatus === "operational" ? (
							<CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-green-500 shrink-0" />
						) : overallStatus === "degraded" ? (
							<AlertTriangle className="h-8 w-8 sm:h-10 sm:w-10 text-yellow-500 shrink-0" />
						) : (
							<XCircle className="h-8 w-8 sm:h-10 sm:w-10 text-red-500 shrink-0" />
						)}
						<div>
							<h3
								className={`text-base sm:text-xl font-semibold ${getOverallStatusColor(overallStatus)}`}
							>
								{getOverallStatusLabel(overallStatus)}
							</h3>
							<p className="text-xs sm:text-sm text-muted-foreground">
								{onlineCount} of {services.length} services operational
							</p>
						</div>
					</div>
					<div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0">
						<div className="text-xl sm:text-2xl font-bold">
							{formatResponseTime(averageResponseTime)}
						</div>
						<div className="text-xs sm:text-sm text-muted-foreground">Avg Response</div>
					</div>
				</div>
			</Card>

			{/* Stats */}
			<div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
				<Card className="p-4">
					<div className="text-2xl font-bold">{services.length}</div>
					<div className="text-sm text-muted-foreground">Total Services</div>
				</Card>
				<Card className="p-4">
					<div className="text-2xl font-bold text-green-600">{onlineCount}</div>
					<div className="text-sm text-muted-foreground">Online</div>
				</Card>
				<Card className="p-4">
					<div className="text-2xl font-bold text-yellow-600">
						{degradedCount}
					</div>
					<div className="text-sm text-muted-foreground">Degraded</div>
				</Card>
				<Card className="p-4">
					<div className="text-2xl font-bold text-red-600">{offlineCount}</div>
					<div className="text-sm text-muted-foreground">Offline</div>
				</Card>
			</div>

			{/* Service Cards */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{services.map((service) => (
					<ServiceCard
						key={service.id}
						service={service}
						onCheck={() => checkService(service.id)}
					/>
				))}
			</div>

			{/* Info */}
			<Card className="p-4 bg-muted/50">
				<div className="flex items-start gap-3">
					<Activity className="h-5 w-5 text-muted-foreground mt-0.5" />
					<div className="text-sm text-muted-foreground">
						<p>
							Services are automatically checked every{" "}
							<strong>
								{overallStatus === "operational" ? "60 seconds" : "15 seconds"}
							</strong>{" "}
							when {overallStatus === "operational" ? "all healthy" : "issues detected"}.
						</p>
						<p className="mt-1">
							Response times over 5 seconds are marked as degraded. Connections
							that fail or timeout after 10 seconds are marked as offline.
						</p>
					</div>
				</div>
			</Card>
		</div>
	);
}
