"use client";

import { AlertCircle, CheckCircle, FileText, Network } from "lucide-react";
import { Card } from "@/components/ui/card";

interface MeshStatsCardProps {
	totalPages: number;
	pillarPages: number;
	clusterPages: number;
	issues: number;
}

export function MeshStatsCard({
	totalPages,
	pillarPages,
	clusterPages,
	issues,
}: MeshStatsCardProps) {
	const stats = [
		{
			label: "Total Pages",
			value: totalPages,
			icon: FileText,
			color: "text-blue-600",
			bgColor: "bg-blue-100",
		},
		{
			label: "Pillar Pages",
			value: pillarPages,
			icon: Network,
			color: "text-purple-600",
			bgColor: "bg-purple-100",
		},
		{
			label: "Cluster Pages",
			value: clusterPages,
			icon: CheckCircle,
			color: "text-green-600",
			bgColor: "bg-green-100",
		},
		{
			label: "Issues",
			value: issues,
			icon: AlertCircle,
			color: "text-red-600",
			bgColor: "bg-red-100",
		},
	];

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			{stats.map((stat) => {
				const Icon = stat.icon;
				return (
					<Card key={stat.label} className="p-6">
						<div className="flex items-center justify-between">
							<div className="space-y-1">
								<p className="text-sm font-medium text-muted-foreground">
									{stat.label}
								</p>
								<p className={`text-3xl font-bold ${stat.color}`}>
									{stat.value}
								</p>
							</div>
							<div className={`rounded-full p-3 ${stat.bgColor}`}>
								<Icon className={`h-6 w-6 ${stat.color}`} />
							</div>
						</div>
					</Card>
				);
			})}
		</div>
	);
}
