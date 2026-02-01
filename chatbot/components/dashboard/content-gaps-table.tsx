"use client";

import { AlertTriangle, TrendingUp, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface ContentGap {
	topic: string;
	priority: "high" | "medium" | "low";
	competitorCoverage: number;
	yourCoverage: number;
	potentialImpact: number;
}

interface ContentGapsTableProps {
	gaps: ContentGap[];
}

export function ContentGapsTable({ gaps }: ContentGapsTableProps) {
	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case "high":
				return "bg-red-100 text-red-800";
			case "medium":
				return "bg-yellow-100 text-yellow-800";
			case "low":
				return "bg-blue-100 text-blue-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const getPriorityIcon = (priority: string) => {
		switch (priority) {
			case "high":
				return <AlertTriangle className="h-3 w-3" />;
			case "medium":
				return <TrendingUp className="h-3 w-3" />;
			case "low":
				return <Zap className="h-3 w-3" />;
			default:
				return null;
		}
	};

	return (
		<Card className="p-4 sm:p-6">
			<div className="space-y-4">
				<div>
					<h3 className="text-lg font-semibold">Content Gaps</h3>
					<p className="text-sm text-muted-foreground">
						Topics your competitors cover that you don&apos;t
					</p>
				</div>

				{/* Mobile Card View */}
				<div className="space-y-3 sm:hidden">
					{gaps.map((gap, index) => (
						<div key={index} className="border rounded-lg p-3 space-y-2">
							<div className="flex items-start justify-between gap-2">
								<span className="font-medium text-sm">{gap.topic}</span>
								<Badge
									variant="secondary"
									className={`flex shrink-0 items-center gap-1 text-xs ${getPriorityColor(gap.priority)}`}
								>
									{getPriorityIcon(gap.priority)}
									{gap.priority}
								</Badge>
							</div>
							<div className="grid grid-cols-3 gap-2 text-xs">
								<div>
									<p className="text-muted-foreground">Competitor</p>
									<p className="font-semibold">{gap.competitorCoverage}%</p>
								</div>
								<div>
									<p className="text-muted-foreground">Yours</p>
									<p className="font-semibold">{gap.yourCoverage}%</p>
								</div>
								<div>
									<p className="text-muted-foreground">Impact</p>
									<p className="font-semibold text-green-600">+{gap.potentialImpact}</p>
								</div>
							</div>
						</div>
					))}
				</div>

				{/* Desktop Table View */}
				<div className="hidden sm:block overflow-x-auto">
					<table className="w-full">
						<thead>
							<tr className="border-b">
								<th className="pb-3 text-left text-sm font-medium text-muted-foreground">
									Topic
								</th>
								<th className="pb-3 text-left text-sm font-medium text-muted-foreground">
									Priority
								</th>
								<th className="pb-3 text-center text-sm font-medium text-muted-foreground">
									Competitor Coverage
								</th>
								<th className="pb-3 text-center text-sm font-medium text-muted-foreground">
									Your Coverage
								</th>
								<th className="pb-3 text-center text-sm font-medium text-muted-foreground">
									Potential Impact
								</th>
							</tr>
						</thead>
						<tbody>
							{gaps.map((gap, index) => (
								<tr key={index} className="border-b last:border-0">
									<td className="py-4 text-sm font-medium">{gap.topic}</td>
									<td className="py-4">
										<Badge
											variant="secondary"
											className={`flex w-fit items-center gap-1 ${getPriorityColor(gap.priority)}`}
										>
											{getPriorityIcon(gap.priority)}
											{gap.priority}
										</Badge>
									</td>
									<td className="py-4 text-center text-sm">
										<span className="font-semibold">
											{gap.competitorCoverage}%
										</span>
									</td>
									<td className="py-4 text-center text-sm">
										<span className="font-semibold">{gap.yourCoverage}%</span>
									</td>
									<td className="py-4 text-center text-sm">
										<span className="font-semibold text-green-600">
											+{gap.potentialImpact}
										</span>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</Card>
	);
}
